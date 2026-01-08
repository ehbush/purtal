import { useState, useEffect } from 'react';
import ServiceCard from '../components/ServiceCard';
import ClientCard from '../components/ClientCard';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const { settings } = useSettings();

  // Get all unique tags from services and clients
  const allTags = Array.from(new Set([
    ...services.flatMap(s => s.tags || []),
    ...clients.flatMap(c => c.tags || [])
  ]));

  useEffect(() => {
    loadServices();
    loadClients();
    loadHealthStatuses();
    
    // Refresh health statuses every 30 seconds
    const interval = setInterval(loadHealthStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      const data = response.data || response;
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      const data = response.data || response;
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    }
  };

  const loadHealthStatuses = async () => {
    try {
      const response = await api.get('/health');
      const data = response.data || response;
      const statusMap = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          statusMap[item.serviceId] = item;
        });
      }
      setHealthStatuses(statusMap);
    } catch (error) {
      console.error('Error loading health statuses:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-900 dark:text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Filter services and clients by selected tags
  const filteredServices = selectedTags.length === 0
    ? services
    : services.filter(service => 
        service.tags && service.tags.some(tag => selectedTags.includes(tag))
      );

  const filteredClients = selectedTags.length === 0
    ? clients
    : clients.filter(client => 
        client.tags && client.tags.some(tag => selectedTags.includes(tag))
      );

  const layoutClass = settings.layout === 'list' ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-8">
      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1 rounded-full text-sm bg-red-600 text-white hover:bg-red-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {Array.isArray(clients) && filteredClients.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Clients</h2>
          <div className={layoutClass}>
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}
      
      {Array.isArray(services) && filteredServices.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Services</h2>
          <div className={layoutClass}>
            {filteredServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                healthStatus={healthStatuses[service.id]}
              />
            ))}
          </div>
        </div>
      )}
      
      {(!Array.isArray(services) || filteredServices.length === 0) && (!Array.isArray(clients) || filteredClients.length === 0) && (
        <div className="text-center py-16">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            {selectedTags.length > 0 
              ? 'No services or clients match the selected tags.'
              : 'No services or clients configured yet.'}
          </p>
          {selectedTags.length > 0 ? (
            <button
              onClick={() => setSelectedTags([])}
              className="text-primary-400 hover:text-primary-300 underline"
            >
              Clear filters
            </button>
          ) : (
            <a
              href="/admin"
              className="text-primary-400 hover:text-primary-300 underline"
            >
              Go to Admin Panel to add services and clients
            </a>
          )}
        </div>
      )}
    </div>
  );
}
