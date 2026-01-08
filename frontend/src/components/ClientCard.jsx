import { Power, Terminal, Server, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import SSHTerminalModal from './SSHTerminalModal';

export default function ClientCard({ client }) {
  const [wolLoading, setWolLoading] = useState(false);
  const [showSSH, setShowSSH] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    if (client.type === 'health-check') {
      loadHealthStatus();
      // Refresh every 60 seconds
      const interval = setInterval(loadHealthStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [client.id, client.type]);

  const loadHealthStatus = async () => {
    try {
      const response = await api.get(`/health/client/${client.id}`);
      setHealthStatus(response.data || response);
    } catch (error) {
      console.error('Error loading health status:', error);
    }
  };

  const handleWakeOnLAN = async () => {
    setWolLoading(true);
    try {
      const response = await api.post(`/wol/${client.id}`);
      alert(response.data?.message || response.message || 'Wake on LAN packet sent successfully!');
    } catch (error) {
      alert('Error sending WOL packet: ' + (error.response?.data?.error || error.message));
    } finally {
      setWolLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!healthStatus || healthStatus.status === 'unknown') {
      return 'border-gray-600';
    }
    
    switch (healthStatus.status) {
      case 'online':
        return 'border-green-500';
      case 'offline':
        return 'border-red-500';
      default:
        return 'border-gray-600';
    }
  };

  const getStatusIcon = () => {
    if (!healthStatus || healthStatus.status === 'unknown') {
      return null;
    }
    
    return healthStatus.status === 'online' ? (
      <Wifi className="w-5 h-5 text-green-400" />
    ) : (
      <WifiOff className="w-5 h-5 text-red-400" />
    );
  };

  return (
    <div className={`bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border-2 transition-all hover:scale-105 hover:shadow-lg ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {client.customIcon || client.icon ? (
            <img
              src={client.customIcon || client.icon}
              alt={client.name}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Server className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold text-lg">{client.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {client.ipAddress && (
                <span className="text-gray-600 dark:text-gray-400 text-sm">{client.ipAddress}</span>
              )}
              {client.category && (
                <span className="text-gray-600 dark:text-gray-400 text-sm">• {client.category}</span>
              )}
              {client.type === 'health-check' && healthStatus && (
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  Status: {healthStatus.status === 'online' ? 'online' : 'offline'}
                </span>
              )}
              {client.tags && client.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {client.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-primary-600/20 text-primary-700 dark:text-primary-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
        </div>
      </div>
      
      {client.description && (
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">{client.description}</p>
      )}
      
      <div className="flex gap-2 flex-wrap">
        {client.macAddress && (
          <button
            onClick={handleWakeOnLAN}
            disabled={wolLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            <Power className="w-4 h-4" />
            {wolLoading ? 'Sending...' : 'Wake on LAN'}
          </button>
        )}
        
        {client.ssh && client.ssh.enabled && (
          <button
            onClick={() => setShowSSH(!showSSH)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            <Terminal className="w-4 h-4" />
            {showSSH ? 'Close SSH' : 'Open SSH'}
          </button>
        )}
      </div>
      
      {healthStatus && healthStatus.status !== 'unknown' && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Status: {healthStatus.status}</span>
              <span>
                Last seen: {healthStatus.lastSeen ? new Date(healthStatus.lastSeen).toLocaleString() : 'never'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {client.ssh && client.ssh.enabled && (
        <SSHTerminalModal
          clientId={client.id}
          clientName={client.name}
          isOpen={showSSH}
          onClose={() => setShowSSH(false)}
        />
      )}
    </div>
  );
}
