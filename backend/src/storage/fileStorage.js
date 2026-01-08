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
        machines: [],
        settings: {
          title: 'Purtal',
          theme: 'default',
          layout: 'grid'
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

  // Machines/Devices methods
  async getMachines() {
    const config = this.readConfig();
    return config.machines || [];
  }

  async getMachine(id) {
    const machines = await this.getMachines();
    return machines.find(m => m.id === id);
  }

  async createMachine(machine) {
    const config = this.readConfig();
    const machines = config.machines || [];
    
    const newMachine = {
      id: machine.id || `machine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...machine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    machines.push(newMachine);
    config.machines = machines;
    this.writeConfig(config);
    
    return newMachine;
  }

  async updateMachine(id, updates) {
    const config = this.readConfig();
    const machines = config.machines || [];
    const index = machines.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new Error('Machine not found');
    }
    
    machines[index] = {
      ...machines[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    config.machines = machines;
    this.writeConfig(config);
    
    return machines[index];
  }

  async deleteMachine(id) {
    const config = this.readConfig();
    const machines = config.machines || [];
    const filtered = machines.filter(m => m.id !== id);
    
    if (filtered.length === machines.length) {
      throw new Error('Machine not found');
    }
    
    config.machines = filtered;
    this.writeConfig(config);
    
    return true;
  }
}
