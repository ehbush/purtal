// Simple in-memory error logger with configurable max entries
const errorLog = [];
const MAX_ERRORS = 10; // Keep last 10 errors

/**
 * Log an error with context
 * @param {Error|string} error - Error object or error message
 * @param {Object} context - Additional context (route, user, etc.)
 */
export function logError(error, context = {}) {
  const errorEntry = {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
    context: {
      ...context,
      userAgent: context.userAgent || null,
      ip: context.ip || null,
      route: context.route || null,
      method: context.method || null
    }
  };

  errorLog.unshift(errorEntry); // Add to beginning
  
  // Keep only the last MAX_ERRORS entries
  if (errorLog.length > MAX_ERRORS) {
    errorLog.pop();
  }

  // Also log to console
  console.error(`[ERROR] ${errorEntry.timestamp}:`, errorEntry.message, errorEntry.context);
  if (errorEntry.stack) {
    console.error(errorEntry.stack);
  }

  return errorEntry;
}

/**
 * Get recent errors
 * @param {number} limit - Maximum number of errors to return (default: MAX_ERRORS)
 * @returns {Array} Array of error entries
 */
export function getRecentErrors(limit = MAX_ERRORS) {
  return errorLog.slice(0, limit);
}

/**
 * Clear all error logs
 */
export function clearErrorLog() {
  errorLog.length = 0;
}

/**
 * Get error log count
 */
export function getErrorCount() {
  return errorLog.length;
}
