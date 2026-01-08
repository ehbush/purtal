import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || join(__dirname, '../../data');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

export class FileStorageAdapter {
  constructor() {
    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Initialize config file if it doesn't exist
    if (!existsSync(CONFIG_FILE)) {
      this.writeConfig({
        services: [],
        clients: [],
        settings: {
          title: 'Purtal',
          theme: 'default',
          layout: 'grid',
          healthCheck: {
            serviceFrequency: 30,
            serviceTimeout: 5000,
            clientFrequency: 60,
            clientTimeout: 3
          }
        }
      });
    }
  }

  readConfig() {
    try {
      const data = readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config:', error);
      return { services: [], settings: {} };
    }
  }

  writeConfig(config) {
    try {
      writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing config:', error);
      return false;
    }
  }

  async getServices() {
    const config = this.readConfig();
    return config.services || [];
  }

  async getService(id) {
    const services = await this.getServices();
    return services.find(s => s.id === id);
  }

  async createService(service) {
    const config = this.readConfig();
    const services = config.services || [];
    
    const newService = {
      id: service.id || `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...service,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    services.push(newService);
    config.services = services;
    this.writeConfig(config);
    
    return newService;
  }

  async updateService(id, updates) {
    const config = this.readConfig();
    const services = config.services || [];
    const index = services.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error('Service not found');
    }
    
    services[index] = {
      ...services[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    config.services = services;
    this.writeConfig(config);
    
    return services[index];
  }

  async deleteService(id) {
    const config = this.readConfig();
    const services = config.services || [];
    const filtered = services.filter(s => s.id !== id);
    
    if (filtered.length === services.length) {
      throw new Error('Service not found');
    }
    
    config.services = filtered;
    this.writeConfig(config);
    
    return true;
  }

  async getSettings() {
    const config = this.readConfig();
    return config.settings || {};
  }

  async updateSettings(settings) {
    const config = this.readConfig();
    config.settings = { ...config.settings, ...settings };
    this.writeConfig(config);
    return config.settings;
  }

  // Clients methods
  async getClients() {
    const config = this.readConfig();
    const clients = config.clients || [];
    
    // Decrypt SSH credentials for all clients
    const { decryptSSHCredentials } = await import('../utils/encryption.js');
    return clients.map(client => {
      if (client.ssh) {
        return {
          ...client,
          ssh: decryptSSHCredentials(client.ssh)
        };
      }
      return client;
    });
  }

  async getClient(id) {
    const clients = await this.getClients();
    const client = clients.find(c => c.id === id);
    
    // Decrypt SSH credentials when retrieving
    if (client && client.ssh) {
      const { decryptSSHCredentials } = await import('../utils/encryption.js');
      client.ssh = decryptSSHCredentials(client.ssh);
    }
    
    return client;
  }

  async createClient(client) {
    const config = this.readConfig();
    const clients = config.clients || [];
    
    // Encrypt SSH credentials before storing
    const clientToStore = { ...client };
    if (clientToStore.ssh) {
      const { encryptSSHCredentials } = await import('../utils/encryption.js');
      clientToStore.ssh = encryptSSHCredentials(clientToStore.ssh);
    }
    
    const newClient = {
      id: client.id || `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...clientToStore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    clients.push(newClient);
    config.clients = clients;
    this.writeConfig(config);
    
    // Return client with decrypted credentials for API response
    if (newClient.ssh) {
      const { decryptSSHCredentials } = await import('../utils/encryption.js');
      newClient.ssh = decryptSSHCredentials(newClient.ssh);
    }
    
    return newClient;
  }

  async updateClient(id, updates) {
    const config = this.readConfig();
    const clients = config.clients || [];
    const index = clients.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('Client not found');
    }
    
    // Encrypt SSH credentials before storing
    const updatesToStore = { ...updates };
    if (updatesToStore.ssh) {
      const { encryptSSHCredentials } = await import('../utils/encryption.js');
      updatesToStore.ssh = encryptSSHCredentials(updatesToStore.ssh);
    }
    
    clients[index] = {
      ...clients[index],
      ...updatesToStore,
      updatedAt: new Date().toISOString()
    };
    
    config.clients = clients;
    this.writeConfig(config);
    
    // Return client with decrypted credentials for API response
    const updatedClient = { ...clients[index] };
    if (updatedClient.ssh) {
      const { decryptSSHCredentials } = await import('../utils/encryption.js');
      updatedClient.ssh = decryptSSHCredentials(updatedClient.ssh);
    }
    
    return updatedClient;
  }

  async deleteClient(id) {
    const config = this.readConfig();
    const clients = config.clients || [];
    const filtered = clients.filter(c => c.id !== id);
    
    if (filtered.length === clients.length) {
      throw new Error('Client not found');
    }
    
    config.clients = filtered;
    this.writeConfig(config);
    
    return true;
  }
}
