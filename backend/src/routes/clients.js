import express from 'express';

export const clientsRouter = express.Router();

// Get all clients
clientsRouter.get('/', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const clients = await storage.getClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single client
clientsRouter.get('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const client = await storage.getClient(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create client
clientsRouter.post('/', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const client = await storage.createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
clientsRouter.put('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const client = await storage.updateClient(req.params.id, req.body);
    res.json(client);
  } catch (error) {
    if (error.message === 'Client not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete client
clientsRouter.delete('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    await storage.deleteClient(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'Client not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});
