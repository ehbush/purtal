import { ExternalLink, AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import clsx from 'clsx';

export default function ServiceCard({ service, healthStatus }) {
  const getStatusIcon = () => {
    if (!healthStatus || healthStatus.status === 'unknown') {
      return null;
    }
    
    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Loader className="w-5 h-5 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    if (!healthStatus || healthStatus.status === 'unknown') {
      return 'border-gray-600';
    }
    
    switch (healthStatus.status) {
      case 'healthy':
        return 'border-green-500';
      case 'unhealthy':
        return 'border-red-500';
      default:
        return 'border-yellow-500';
    }
  };

  const iconUrl = service.icon || service.customIcon;

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'block p-6 rounded-lg bg-gray-800/50 backdrop-blur-sm border-2 transition-all hover:scale-105 hover:shadow-lg',
        getStatusColor()
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={service.name}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
              {service.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-white font-semibold text-lg">{service.name}</h3>
            {service.category && (
              <span className="text-gray-400 text-sm">{service.category}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      {service.description && (
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{service.description}</p>
      )}
      
      {healthStatus && healthStatus.status !== 'unknown' && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Status: {healthStatus.status}</span>
            {healthStatus.lastChecked && (
              <span>
                {new Date(healthStatus.lastChecked).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </a>
  );
}
