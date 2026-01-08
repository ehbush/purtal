import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-west-2',
  ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT })
});

const SERVICES_TABLE = process.env.DYNAMODB_SERVICES_TABLE || 'purtal-services';
const SETTINGS_TABLE = process.env.DYNAMODB_SETTINGS_TABLE || 'purtal-settings';
const CLIENTS_TABLE = process.env.DYNAMODB_CLIENTS_TABLE || 'purtal-clients';

export class DynamoDBStorageAdapter {
  async getServices() {
    try {
      const result = await dynamoDb.scan({
        TableName: SERVICES_TABLE
      }).promise();
      
      return result.Items || [];
    } catch (error) {
      console.error('Error reading services from DynamoDB:', error);
      return [];
    }
  }

  async getService(id) {
    try {
      const result = await dynamoDb.get({
        TableName: SERVICES_TABLE,
        Key: { id }
      }).promise();
      
      return result.Item || null;
    } catch (error) {
      console.error('Error reading service from DynamoDB:', error);
      return null;
    }
  }

  async createService(service) {
    const newService = {
      id: service.id || `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...service,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await dynamoDb.put({
        TableName: SERVICES_TABLE,
        Item: newService
      }).promise();
      
      return newService;
    } catch (error) {
      console.error('Error creating service in DynamoDB:', error);
      throw error;
    }
  }

  async updateService(id, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updates).forEach((key, index) => {
      const nameKey = `#attr${index}`;
      const valueKey = `:val${index}`;
      updateExpression.push(`${nameKey} = ${valueKey}`);
      expressionAttributeNames[nameKey] = key;
      expressionAttributeValues[valueKey] = updates[key];
    });
    
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    try {
      const result = await dynamoDb.update({
        TableName: SERVICES_TABLE,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }).promise();
      
      return result.Attributes;
    } catch (error) {
      console.error('Error updating service in DynamoDB:', error);
      throw error;
    }
  }

  async deleteService(id) {
    try {
      await dynamoDb.delete({
        TableName: SERVICES_TABLE,
        Key: { id }
      }).promise();
      
      return true;
    } catch (error) {
      console.error('Error deleting service from DynamoDB:', error);
      throw error;
    }
  }

  async getSettings() {
    try {
      const result = await dynamoDb.get({
        TableName: SETTINGS_TABLE,
        Key: { id: 'main' }
      }).promise();
      
      return result.Item?.settings || {};
    } catch (error) {
      console.error('Error reading settings from DynamoDB:', error);
      return {};
    }
  }

  async updateSettings(settings) {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await dynamoDb.put({
        TableName: SETTINGS_TABLE,
        Item: {
          id: 'main',
          settings: updatedSettings,
          updatedAt: new Date().toISOString()
        }
      }).promise();
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings in DynamoDB:', error);
      throw error;
    }
  }

  // Clients methods
  async getClients() {
    try {
      const result = await dynamoDb.scan({
        TableName: CLIENTS_TABLE
      }).promise();
      
      const clients = result.Items || [];
      
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
    } catch (error) {
      console.error('Error reading clients from DynamoDB:', error);
      return [];
    }
  }

  async getClient(id) {
    try {
      const result = await dynamoDb.get({
        TableName: CLIENTS_TABLE,
        Key: { id }
      }).promise();
      
      const client = result.Item || null;
      
      // Decrypt SSH credentials when retrieving
      if (client && client.ssh) {
        const { decryptSSHCredentials } = await import('../utils/encryption.js');
        client.ssh = decryptSSHCredentials(client.ssh);
      }
      
      return client;
    } catch (error) {
      console.error('Error reading client from DynamoDB:', error);
      return null;
    }
  }

  async createClient(client) {
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
    
    try {
      await dynamoDb.put({
        TableName: CLIENTS_TABLE,
        Item: newClient
      }).promise();
      
      // Return client with decrypted credentials for API response
      if (newClient.ssh) {
        const { decryptSSHCredentials } = await import('../utils/encryption.js');
        newClient.ssh = decryptSSHCredentials(newClient.ssh);
      }
      
      return newClient;
    } catch (error) {
      console.error('Error creating client in DynamoDB:', error);
      throw error;
    }
  }

  async updateClient(id, updates) {
    try {
      // Get current client to merge updates
      const current = await this.getClient(id);
      if (!current) {
        throw new Error('Client not found');
      }
      
      // Encrypt SSH credentials before storing
      const updatesToStore = { ...updates };
      if (updatesToStore.ssh) {
        const { encryptSSHCredentials } = await import('../utils/encryption.js');
        updatesToStore.ssh = encryptSSHCredentials(updatesToStore.ssh);
      }
      
      // Merge updates with current client
      const updated = {
        ...current,
        ...updatesToStore,
        updatedAt: new Date().toISOString()
      };
      
      // Re-encrypt existing SSH credentials if they were decrypted
      if (updated.ssh && !updatesToStore.ssh) {
        const { encryptSSHCredentials } = await import('../utils/encryption.js');
        updated.ssh = encryptSSHCredentials(updated.ssh);
      }
      
      // Use put instead of update to handle nested objects properly
      await dynamoDb.put({
        TableName: CLIENTS_TABLE,
        Item: updated
      }).promise();
      
      // Return client with decrypted credentials for API response
      if (updated.ssh) {
        const { decryptSSHCredentials } = await import('../utils/encryption.js');
        updated.ssh = decryptSSHCredentials(updated.ssh);
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating client in DynamoDB:', error);
      throw error;
    }
  }

  async deleteClient(id) {
    try {
      await dynamoDb.delete({
        TableName: CLIENTS_TABLE,
        Key: { id }
      }).promise();
      
      return true;
    } catch (error) {
      console.error('Error deleting client from DynamoDB:', error);
      throw error;
    }
  }
}
