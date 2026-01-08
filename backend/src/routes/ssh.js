import { Client } from 'ssh2';
import { decryptSSHCredentials } from '../utils/encryption.js';
import { logError } from '../utils/logger.js';

export function setupSSHRoutes(app) {
  // WebSocket endpoint for SSH connections
  app.ws('/api/ssh/:id/connect', async (ws, req) => {
    const clientId = req.params.id;
    const storage = req.app.locals.storage;
    
    try {
      const client = await storage.getClient(clientId);
      
      if (!client) {
        ws.close(1008, 'Client not found');
        return;
      }
      
      if (!client.ssh || !client.ssh.enabled) {
        ws.close(1008, 'SSH not enabled for this client');
        return;
      }
      
      // Decrypt SSH credentials (storage should already decrypt, but double-check)
      const decryptedSSH = decryptSSHCredentials(client.ssh);
      
      const sshConfig = {
        host: decryptedSSH.host || client.ipAddress,
        port: decryptedSSH.port || 22,
        username: decryptedSSH.username,
        ...(decryptedSSH.password && { password: decryptedSSH.password }),
        ...(decryptedSSH.privateKey && { privateKey: decryptedSSH.privateKey }),
        ...(decryptedSSH.passphrase && { passphrase: decryptedSSH.passphrase }),
        readyTimeout: 20000
      };
      
      const conn = new Client();
      
      conn.on('ready', () => {
        console.log(`SSH connection established to ${client.name}`);
        ws.send(JSON.stringify({ type: 'connected', message: 'SSH connection established' }));
        
        conn.shell((err, stream) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }));
            conn.end();
            return;
          }
          
          // Forward terminal data
          stream.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'data', data: data.toString() }));
          });
          
          stream.on('close', () => {
            ws.send(JSON.stringify({ type: 'close' }));
            conn.end();
          });
          
          // Handle incoming WebSocket messages
          ws.on('message', (message) => {
            try {
              const msg = JSON.parse(message);
              if (msg.type === 'input' && stream.writable) {
                stream.write(msg.data);
              } else if (msg.type === 'resize') {
                // Resize terminal window
                try {
                  stream.setWindow(msg.rows, msg.cols, null, null);
                } catch (err) {
                  // setWindow might not be available, ignore
                }
              }
            } catch (error) {
              console.error('Error handling WebSocket message:', error);
            }
          });
          
          ws.on('close', () => {
            stream.end();
            conn.end();
          });
        });
      });
      
      conn.on('error', (err) => {
        logError(err, {
          route: '/api/ssh/:id/connect',
          method: 'WS',
          clientId: clientId,
          clientName: client.name
        });
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
        ws.close();
      });
      
      conn.connect(sshConfig);
      
    } catch (error) {
      logError(error, {
        route: '/api/ssh/:id/connect',
        method: 'WS',
        clientId: clientId
      });
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
      ws.close();
    }
  });
}
