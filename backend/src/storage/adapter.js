import { FileStorageAdapter } from './fileStorage.js';
import { DynamoDBStorageAdapter } from './dynamoStorage.js';

export function createStorageAdapter() {
  const storageType = process.env.STORAGE_TYPE || 'file';
  
  if (storageType === 'dynamodb') {
    return new DynamoDBStorageAdapter();
  }
  
  return new FileStorageAdapter();
}
