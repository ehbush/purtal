import express from 'express';
import axios from 'axios';
import cron from 'node-cron';

export const healthRouter = express.Router();

// In-memory cache for health status
const healthCache = new Map();

// Health check function
async function checkServiceHealth(service) {
  if (!service.healthCheck || !service.healthCheck.enabled) {
    return { status: 'unknown', lastChecked: null };
  }

  const { url, method = 'GET', timeout = 5000, expectedStatus = 200 } = service.healthCheck;

  try {
    const response = await axios({
      method,
      url,
      timeout,
      validateStatus: () => true // Don't throw on any status
    });

    const isHealthy = response.status === expectedStatus;
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      lastChecked: new Date().toISOString(),
      responseTime: response.headers['x-response-time'] || null
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}

// Check health for a single service
healthRouter.get('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const service = await storage.getService(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const health = await checkServiceHealth(service);
    healthCache.set(req.params.id, health);
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get health for all services
healthRouter.get('/', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const services = await storage.getServices();
    
    const healthPromises = services.map(async (service) => {
      const health = await checkServiceHealth(service);
      healthCache.set(service.id, health);
      return { serviceId: service.id, ...health };
    });
    
    const healthStatuses = await Promise.all(healthPromises);
    res.json(healthStatuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cached health status
healthRouter.get('/cache/all', (req, res) => {
  const cache = {};
  healthCache.forEach((value, key) => {
    cache[key] = value;
  });
  res.json(cache);
});

// Start background health checking for services with health checks enabled
export function startHealthCheckScheduler(storage) {
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const services = await storage.getServices();
      
      for (const service of services) {
        if (service.healthCheck && service.healthCheck.enabled) {
          const health = await checkServiceHealth(service);
          healthCache.set(service.id, health);
        }
      }
    } catch (error) {
      console.error('Error in health check scheduler:', error);
    }
  });
}
