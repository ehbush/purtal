import express from 'express';
import { logError } from '../utils/logger.js';

export const configRouter = express.Router();

// Get settings
configRouter.get('/settings', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const settings = await storage.getSettings();
    res.json(settings);
  } catch (error) {
    logError(error, {
      route: '/api/config/settings',
      method: 'GET'
    });
    res.status(500).json({ error: error.message });
  }
});

// Update settings
configRouter.put('/settings', async (req, res) => {
  try {
    const storage = req.app.locals.storage;
    const settings = await storage.updateSettings(req.body);
    res.json(settings);
  } catch (error) {
    logError(error, {
      route: '/api/config/settings',
      method: 'PUT'
    });
    res.status(500).json({ error: error.message });
  }
});
