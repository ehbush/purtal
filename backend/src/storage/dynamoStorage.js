import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-west-2',
  ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT })
});

const SERVICES_TABLE = process.env.DYNAMODB_SERVICES_TABLE || 'purtal-services';
const SETTINGS_TABLE = process.env.DYNAMODB_SETTINGS_TABLE || 'purtal-settings';
const MACHINES_TABLE = process.env.DYNAMODB_MACHINES_TABLE || 'purtal-machines';

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

  // Machines/Devices methods
  async getMachines() {
    try {
      const result = await dynamoDb.scan({
        TableName: MACHINES_TABLE
      }).promise();
      
      return result.Items || [];
    } catch (error) {
      console.error('Error reading machines from DynamoDB:', error);
      return [];
    }
  }

  async getMachine(id) {
    try {
      const result = await dynamoDb.get({
        TableName: MACHINES_TABLE,
        Key: { id }
      }).promise();
      
      return result.Item || null;
    } catch (error) {
      console.error('Error reading machine from DynamoDB:', error);
      return null;
    }
  }

  async createMachine(machine) {
    const newMachine = {
      id: machine.id || `machine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...machine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await dynamoDb.put({
        TableName: MACHINES_TABLE,
        Item: newMachine
      }).promise();
      
      return newMachine;
    } catch (error) {
      console.error('Error creating machine in DynamoDB:', error);
      throw error;
    }
  }

  async updateMachine(id, updates) {
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
        TableName: MACHINES_TABLE,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }).promise();
      
      return result.Attributes;
    } catch (error) {
      console.error('Error updating machine in DynamoDB:', error);
      throw error;
    }
  }

  async deleteMachine(id) {
    try {
      await dynamoDb.delete({
        TableName: MACHINES_TABLE,
        Key: { id }
      }).promise();
      
      return true;
    } catch (error) {
      console.error('Error deleting machine from DynamoDB:', error);
      throw error;
    }
  }
}
