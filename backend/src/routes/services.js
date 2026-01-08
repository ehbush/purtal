import express from 'express';

export const servicesRouter = express.Router();

// Get all services
servicesRouter.get('/', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const services = await storage.getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single service
servicesRouter.get('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const service = await storage.getService(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create service
servicesRouter.post('/', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const service = await storage.createService(req.body);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update service
servicesRouter.put('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const service = await storage.updateService(req.params.id, req.body);
    res.json(service);
  } catch (error) {
    if (error.message === 'Service not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete service
servicesRouter.delete('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    await storage.deleteService(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'Service not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});
