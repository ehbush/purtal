import { useState, useEffect } from 'react';
import { AlertCircle, X, Trash2, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function ErrorLogViewer() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedError, setExpandedError] = useState(null);

  useEffect(() => {
    loadErrors();
    // Refresh every 30 seconds
    const interval = setInterval(loadErrors, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadErrors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/errors?limit=10');
      setErrors(response.data?.errors || []);
    } catch (error) {
      console.error('Error loading error log:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = async () => {
    if (!confirm('Are you sure you want to clear the error log?')) {
      return;
    }
    try {
      await api.delete('/errors');
      setErrors([]);
    } catch (error) {
      console.error('Error clearing error log:', error);
      alert('Failed to clear error log: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (errors.length === 0 && !loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-green-500" />
            Application Error Log
          </h3>
          <button
            onClick={loadErrors}
            disabled={loading}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">No errors logged. All systems operational!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Application Error Log ({errors.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadErrors}
            disabled={loading}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={clearErrors}
            className="p-2 hover:bg-red-600 hover:text-white rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="Clear error log"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {errors.map((error) => (
          <div
            key={error.id}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(error.timestamp)}
                  </span>
                  {error.context?.route && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                      {error.context.method || 'GET'} {error.context.route}
                    </span>
                  )}
                </div>
                <p className="text-red-800 dark:text-red-300 font-medium text-sm mb-2">
                  {error.message}
                </p>
                {error.context && Object.keys(error.context).length > 0 && (
                  <button
                    onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    {expandedError === error.id ? 'Hide' : 'Show'} details
                  </button>
                )}
              </div>
            </div>

            {expandedError === error.id && (
              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                {error.stack && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Stack Trace:</p>
                    <pre className="text-xs bg-gray-900 text-gray-300 p-2 rounded overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {error.context && Object.keys(error.context).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Context:</p>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 rounded overflow-x-auto">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
