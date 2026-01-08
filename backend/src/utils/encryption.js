import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is 12, but we'll use 16 for compatibility
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment variable
 * If not set, throws an error (security requirement)
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for SSH credential encryption');
  }
  
  // If the key is provided as a hex string, convert it
  // Otherwise, derive a key from it using PBKDF2
  if (key.length === 64) {
    // Assume it's a hex-encoded 32-byte key
    try {
      return Buffer.from(key, 'hex');
    } catch (e) {
      // Not valid hex, derive key instead
    }
  }
  
  // Derive a key from the provided string using PBKDF2
  return crypto.pbkdf2Sync(key, 'purtal-ssh-encryption-salt', 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data (SSH passwords, private keys, passphrases)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text (hex-encoded)
 */
export function encrypt(text) {
  if (!text) {
    return text; // Return empty/null as-is
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text (hex-encoded)
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) {
    return encryptedText; // Return empty/null as-is
  }
  
  // Check if it's already in the encrypted format (contains colons)
  if (!encryptedText.includes(':')) {
    // Legacy unencrypted data - return as-is for backward compatibility
    // In production, you might want to log a warning or migrate
    return encryptedText;
  }
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
}

/**
 * Encrypt SSH credentials object
 * Encrypts password, privateKey, and passphrase fields
 */
export function encryptSSHCredentials(ssh) {
  if (!ssh || !ssh.enabled) {
    return ssh;
  }
  
  const encrypted = { ...ssh };
  
  if (encrypted.password) {
    encrypted.password = encrypt(encrypted.password);
  }
  
  if (encrypted.privateKey) {
    encrypted.privateKey = encrypt(encrypted.privateKey);
  }
  
  if (encrypted.passphrase) {
    encrypted.passphrase = encrypt(encrypted.passphrase);
  }
  
  return encrypted;
}

/**
 * Decrypt SSH credentials object
 * Decrypts password, privateKey, and passphrase fields
 */
export function decryptSSHCredentials(ssh) {
  if (!ssh || !ssh.enabled) {
    return ssh;
  }
  
  const decrypted = { ...ssh };
  
  if (decrypted.password) {
    decrypted.password = decrypt(decrypted.password);
  }
  
  if (decrypted.privateKey) {
    decrypted.privateKey = decrypt(decrypted.privateKey);
  }
  
  if (decrypted.passphrase) {
    decrypted.passphrase = decrypt(decrypted.passphrase);
  }
  
  return decrypted;
}
