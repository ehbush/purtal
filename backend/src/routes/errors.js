import express from 'express';
import { getRecentErrors, clearErrorLog, getErrorCount } from '../utils/logger.js';

export const errorsRouter = express.Router();

// Get recent errors
errorsRouter.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const errors = getRecentErrors(limit);
    res.json({
      errors,
      count: getErrorCount(),
      total: errors.length
    });
  } catch (error) {
    console.error('Error fetching error log:', error);
    res.status(500).json({ error: 'Failed to fetch error log' });
  }
});

// Clear error log
errorsRouter.delete('/', (req, res) => {
  try {
    clearErrorLog();
    res.json({ message: 'Error log cleared' });
  } catch (error) {
    console.error('Error clearing error log:', error);
    res.status(500).json({ error: 'Failed to clear error log' });
  }
});
