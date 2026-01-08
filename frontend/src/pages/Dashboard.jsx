import { useState, useEffect } from 'react';
import ServiceCard from '../components/ServiceCard';
import MachineCard from '../components/MachineCard';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [machines, setMachines] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    loadServices();
    loadMachines();
    loadHealthStatuses();
    
    // Refresh health statuses every 30 seconds
    const interval = setInterval(loadHealthStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.get('/services');
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      const data = await api.get('/machines');
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const loadHealthStatuses = async () => {
    try {
      const data = await api.get('/health');
      const statusMap = {};
      data.forEach(item => {
        statusMap[item.serviceId] = item;
      });
      setHealthStatuses(statusMap);
    } catch (error) {
      console.error('Error loading health statuses:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const layoutClass = settings.layout === 'list' ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

  return (
    <div className="space-y-8">
      {machines.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Machines</h2>
          <div className={layoutClass}>
            {machines.map(machine => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        </div>
      )}
      
      {services.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Services</h2>
          <div className={layoutClass}>
            {services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                healthStatus={healthStatuses[service.id]}
              />
            ))}
          </div>
        </div>
      )}
      
      {services.length === 0 && machines.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">No services or machines configured yet.</p>
          <a
            href="/admin"
            className="text-primary-400 hover:text-primary-300 underline"
          >
            Go to Admin Panel to add services and machines
          </a>
        </div>
      )}
    </div>
  );
}
