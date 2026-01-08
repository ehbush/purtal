import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import expressWs from 'express-ws';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createStorageAdapter } from './storage/adapter.js';
import { servicesRouter } from './routes/services.js';
import { configRouter } from './routes/config.js';
import { healthRouter, startHealthCheckScheduler } from './routes/health.js';
import { machinesRouter } from './routes/machines.js';
import { wolRouter } from './routes/wol.js';
import { setupSSHRoutes } from './routes/ssh.js';
import { getSSLOptions, setupAcmeChallenge } from './ssl/config.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
expressWs(app); // Enable WebSocket support
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../../frontend/dist')));

// Initialize storage adapter
const storageAdapter = createStorageAdapter();
app.locals.storage = storageAdapter;

// Start health check scheduler
startHealthCheckScheduler(storageAdapter);

// Routes
app.use('/api/services', servicesRouter);
app.use('/api/config', configRouter);
app.use('/api/health', healthRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/wol', wolRouter);

// Setup SSH WebSocket routes
setupSSHRoutes(app);

// Setup ACME challenge route for Let's Encrypt (will be used if Let's Encrypt is enabled)
const certDir = process.env.LETSENCRYPT_CERT_DIR || join(__dirname, '../../certs');
setupAcmeChallenge(app, certDir);

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
});

// Start server with SSL support
async function startServer() {
  const sslMode = process.env.SSL_MODE || 'none';
  const httpPort = parseInt(process.env.HTTP_PORT || (sslMode !== 'none' ? '80' : PORT));
  const httpsPort = parseInt(process.env.HTTPS_PORT || (sslMode !== 'none' ? '443' : null));
  
  if (sslMode !== 'none') {
    try {
      // For Let's Encrypt, start HTTP first for ACME challenges
      let httpServer = null;
      if (sslMode === 'letsencrypt' && httpPort !== httpsPort) {
        const challengeApp = express();
        setupAcmeChallenge(challengeApp, certDir);
        httpServer = http.createServer(challengeApp);
        await new Promise((resolve) => {
          httpServer.listen(httpPort, () => {
            console.log(`HTTP server running on port ${httpPort} (for Let's Encrypt challenges)`);
            resolve();
          });
        });
      }
      
      // Now get SSL options (this may trigger Let's Encrypt certificate acquisition)
      const sslOptions = await getSSLOptions();
      
      // Start HTTPS server
      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(httpsPort, () => {
        console.log(`HTTPS server running on port ${httpsPort}`);
        console.log(`Storage adapter: ${process.env.STORAGE_TYPE || 'file'}`);
        if (sslMode === 'letsencrypt') {
          console.log(`SSL: Let's Encrypt certificate for ${process.env.LETSENCRYPT_DOMAIN}`);
        } else {
          console.log(`SSL: Custom certificate enabled`);
        }
      });
      
      // Setup HTTP redirect server (if not already started for Let's Encrypt)
      if (process.env.SSL_REDIRECT_HTTP !== 'false' && httpPort !== httpsPort) {
        if (sslMode === 'letsencrypt' && httpServer) {
          // Update existing HTTP server to handle redirects
          const redirectApp = express();
          redirectApp.use((req, res, next) => {
            // Allow ACME challenges through
            if (req.path.startsWith('/.well-known/acme-challenge/')) {
              return next();
            }
            // Redirect everything else to HTTPS
            const host = req.headers.host || 'localhost';
            const httpsUrl = `https://${host}${req.url}`;
            res.writeHead(301, { Location: httpsUrl });
            res.end();
          });
          setupAcmeChallenge(redirectApp, certDir);
          
          // Close old server and start new one
          httpServer.close(() => {
            const newHttpServer = http.createServer(redirectApp);
            newHttpServer.listen(httpPort, () => {
              console.log(`HTTP server running on port ${httpPort} (redirecting to HTTPS, serving ACME challenges)`);
            });
          });
        } else if (sslMode !== 'letsencrypt') {
          // Start redirect server for custom certs
          const redirectServer = http.createServer((req, res) => {
            const host = req.headers.host || 'localhost';
            const httpsUrl = `https://${host}${req.url}`;
            res.writeHead(301, { Location: httpsUrl });
            res.end();
          });
          redirectServer.listen(httpPort, () => {
            console.log(`HTTP redirect server running on port ${httpPort} (redirecting to HTTPS)`);
          });
        }
      }
    } catch (error) {
      console.error('Failed to start HTTPS server:', error);
      console.log('Falling back to HTTP only...');
      // Fallback to HTTP if SSL setup fails
      app.listen(PORT, () => {
        console.log(`HTTP server running on port ${PORT}`);
        console.log(`Storage adapter: ${process.env.STORAGE_TYPE || 'file'}`);
      });
    }
  } else {
    // Start HTTP server only
    app.listen(PORT, () => {
      console.log(`HTTP server running on port ${PORT}`);
      console.log(`Storage adapter: ${process.env.STORAGE_TYPE || 'file'}`);
    });
  }
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
