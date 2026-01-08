import express from 'express';
import axios from 'axios';
import cron from 'node-cron';
import ping from 'ping';

export const healthRouter = express.Router();

// In-memory cache for health status
const healthCache = new Map();
const clientHealthCache = new Map();
// Track last seen times (when status was healthy/online)
const lastSeenCache = new Map();
const clientLastSeenCache = new Map();

// Get health check settings from storage
async function getHealthCheckSettings(storage) {
  const settings = await storage.getSettings();
  return {
    serviceFrequency: settings.healthCheck?.serviceFrequency || 30, // seconds
    serviceTimeout: settings.healthCheck?.serviceTimeout || 5000, // milliseconds
    clientFrequency: settings.healthCheck?.clientFrequency || 60, // seconds
    clientTimeout: settings.healthCheck?.clientTimeout || 3 // seconds for ping
  };
}

// Health check function
async function checkServiceHealth(service, timeout = 5000, storage = null) {
  if (!service.healthCheck || !service.healthCheck.enabled) {
    return { status: 'unknown', lastChecked: null };
  }

  const { url, method = 'GET', expectedStatus = 200 } = service.healthCheck;
  const checkTimeout = service.healthCheck.timeout || timeout;
  // Attach storage reference for persistence
  service._storage = storage;

  try {
    const response = await axios({
      method,
      url,
      timeout: checkTimeout,
      validateStatus: () => true // Don't throw on any status
    });

    const isHealthy = response.status === expectedStatus;
    const now = new Date().toISOString();
    
    // Get current lastSeen from storage
    const storage = service._storage || null;
    let currentLastSeen = null;
    if (storage) {
      try {
        const currentService = await storage.getService(service.id);
        currentLastSeen = currentService?.lastSeen || null;
      } catch (err) {
        // Fallback to cache if storage access fails
        currentLastSeen = lastSeenCache.get(service.id) || null;
      }
    } else {
      currentLastSeen = lastSeenCache.get(service.id) || null;
    }
    
    // Update last seen time if healthy
    if (isHealthy) {
      const newLastSeen = now;
      lastSeenCache.set(service.id, newLastSeen);
      // Persist to storage
      if (storage) {
        try {
          await storage.updateService(service.id, { lastSeen: newLastSeen });
        } catch (err) {
          console.error('Error updating service lastSeen:', err);
        }
      }
      currentLastSeen = newLastSeen;
    }
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      lastChecked: now,
      lastSeen: currentLastSeen,
      responseTime: response.headers['x-response-time'] || null
    };
  } catch (error) {
    const now = new Date().toISOString();
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: now,
      lastSeen: lastSeenCache.get(service.id) || null
    };
  }
}

// Get cached health status
healthRouter.get('/cache/all', (req, res) => {
  const cache = {};
  healthCache.forEach((value, key) => {
    cache[key] = value;
  });
  res.json(cache);
});

// Check health for a single service
healthRouter.get('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const service = await storage.getService(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const settings = await getHealthCheckSettings(storage);
    const health = await checkServiceHealth(service, settings.serviceTimeout, storage);
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
    const settings = await getHealthCheckSettings(storage);
    
    const healthPromises = services.map(async (service) => {
      const health = await checkServiceHealth(service, settings.serviceTimeout, storage);
      healthCache.set(service.id, health);
      return { serviceId: service.id, ...health };
    });
    
    const healthStatuses = await Promise.all(healthPromises);
    res.json(healthStatuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ping-based health check for clients
async function checkClientHealth(client, timeout = 3, storage = null) {
  if (!client.type || client.type !== 'health-check') {
    return { status: 'unknown', lastChecked: null };
  }

  if (!client.ipAddress) {
    return {
      status: 'unknown',
      error: 'IP address not configured',
      lastChecked: new Date().toISOString()
    };
  }

  // Get current lastSeen from storage
  let currentLastSeen = null;
  if (storage) {
    try {
      const currentClient = await storage.getClient(client.id);
      currentLastSeen = currentClient?.lastSeen || null;
    } catch (err) {
      // Fallback to cache if storage access fails
      currentLastSeen = clientLastSeenCache.get(client.id) || null;
    }
  } else {
    currentLastSeen = clientLastSeenCache.get(client.id) || null;
  }

  try {
    const result = await ping.promise.probe(client.ipAddress, {
      timeout: timeout,
      min_reply: 1
    });

    const now = new Date().toISOString();
    
    // Update last seen time if online
    if (result.alive) {
      const newLastSeen = now;
      clientLastSeenCache.set(client.id, newLastSeen);
      // Persist to storage
      if (storage) {
        try {
          await storage.updateClient(client.id, { lastSeen: newLastSeen });
        } catch (err) {
          console.error('Error updating client lastSeen:', err);
        }
      }
      currentLastSeen = newLastSeen;
    }

    return {
      status: result.alive ? 'online' : 'offline',
      alive: result.alive,
      time: result.time || null,
      lastChecked: now,
      lastSeen: currentLastSeen
    };
  } catch (error) {
    const now = new Date().toISOString();
    return {
      status: 'offline',
      error: error.message,
      lastChecked: now,
      lastSeen: currentLastSeen
    };
  }
}

// Get health status for a client
healthRouter.get('/client/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const client = await storage.getClient(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const settings = await getHealthCheckSettings(storage);
    const health = await checkClientHealth(client, settings.clientTimeout, storage);
    clientHealthCache.set(req.params.id, health);
    
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get health status for all clients
healthRouter.get('/clients', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const clients = await storage.getClients();
    const settings = await getHealthCheckSettings(storage);
    
    const healthPromises = clients
      .filter(client => client.type === 'health-check')
      .map(async (client) => {
        const health = await checkClientHealth(client, settings.clientTimeout, storage);
        clientHealthCache.set(client.id, health);
        return { clientId: client.id, ...health };
      });
    
    const healthStatuses = await Promise.all(healthPromises);
    res.json(healthStatuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start background health checking for services with health checks enabled
export function startHealthCheckScheduler(storage) {
  // Dynamic scheduler that reads settings
  let serviceSchedule = null;
  let clientSchedule = null;

  async function scheduleHealthChecks() {
    const settings = await getHealthCheckSettings(storage);
    
    // Cancel existing schedules
    if (serviceSchedule) {
      serviceSchedule.destroy();
    }
    if (clientSchedule) {
      clientSchedule.destroy();
    }

    // Schedule service health checks
    const serviceCron = `*/${settings.serviceFrequency} * * * * *`;
    serviceSchedule = cron.schedule(serviceCron, async () => {
      try {
        const currentSettings = await getHealthCheckSettings(storage);
        const services = await storage.getServices();
        
        for (const service of services) {
          if (service.healthCheck && service.healthCheck.enabled) {
            const health = await checkServiceHealth(service, currentSettings.serviceTimeout, storage);
            healthCache.set(service.id, health);
          }
        }
      } catch (error) {
        console.error('Error in health check scheduler:', error);
      }
    }, { scheduled: true });

    // Schedule client health checks
    const clientCron = `*/${settings.clientFrequency} * * * * *`;
    clientSchedule = cron.schedule(clientCron, async () => {
      try {
        const currentSettings = await getHealthCheckSettings(storage);
        const clients = await storage.getClients();
        
        for (const client of clients) {
          if (client.type === 'health-check') {
            const health = await checkClientHealth(client, currentSettings.clientTimeout, storage);
            clientHealthCache.set(client.id, health);
          }
        }
      } catch (error) {
        console.error('Error in client health check scheduler:', error);
      }
    }, { scheduled: true });
  }

  // Initial schedule
  scheduleHealthChecks();

  // Re-schedule when settings change (check every 5 minutes)
  cron.schedule('*/5 * * * *', scheduleHealthChecks);
}
