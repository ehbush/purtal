import express from 'express';

export const machinesRouter = express.Router();

// Get all machines
machinesRouter.get('/', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const machines = await storage.getMachines();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single machine
machinesRouter.get('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const machine = await storage.getMachine(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create machine
machinesRouter.post('/', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const machine = await storage.createMachine(req.body);
    res.status(201).json(machine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update machine
machinesRouter.put('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const machine = await storage.updateMachine(req.params.id, req.body);
    res.json(machine);
  } catch (error) {
    if (error.message === 'Machine not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete machine
machinesRouter.delete('/:id', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    await storage.deleteMachine(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'Machine not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});
