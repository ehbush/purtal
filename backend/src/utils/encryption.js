import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is 12, but we'll use 16 for compatibility
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

// Get data directory from environment or use default
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '../../data');
const KEY_FILE = join(DATA_DIR, '.encryption_key');

/**
 * Generate a new encryption key (32 bytes = 64 hex characters)
 * @returns {string} Hex-encoded encryption key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Get or create the encryption key
 * Priority: 1) ENV var, 2) Key file, 3) Generate new key and save to file
 * @returns {Buffer} Encryption key as Buffer
 */
function getOrCreateEncryptionKey() {
  // Priority 1: Check environment variable (allows manual override)
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    // If the key is provided as a hex string, convert it
    // Otherwise, derive a key from it using PBKDF2
    if (envKey.length === 64) {
      // Assume it's a hex-encoded 32-byte key
      try {
        return Buffer.from(envKey, 'hex');
      } catch (e) {
        // Not valid hex, derive key instead
      }
    }
    
    // Derive a key from the provided string using PBKDF2
    return crypto.pbkdf2Sync(envKey, 'purtal-ssh-encryption-salt', 100000, KEY_LENGTH, 'sha256');
  }
  
  // Priority 2: Check for existing key file
  if (existsSync(KEY_FILE)) {
    try {
      const keyHex = readFileSync(KEY_FILE, 'utf8').trim();
      if (keyHex.length === 64) {
        return Buffer.from(keyHex, 'hex');
      } else {
        console.warn('Encryption key file exists but has invalid format. Generating new key...');
      }
    } catch (error) {
      console.error('Error reading encryption key file:', error);
      console.warn('Generating new encryption key...');
    }
  }
  
  // Priority 3: Generate new key and save to file
  try {
    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Generate new key
    const newKey = generateEncryptionKey();
    
    // Write key to file
    writeFileSync(KEY_FILE, newKey, { mode: 0o600 }); // Read/write for owner only
    
    // Try to set file permissions (works on Unix-like systems)
    try {
      chmodSync(KEY_FILE, 0o600);
    } catch (chmodError) {
      // chmod may fail on Windows, but that's okay - the file mode in writeFileSync should help
      if (process.platform !== 'win32') {
        console.warn('Could not set encryption key file permissions:', chmodError.message);
      }
    }
    
    console.log('Generated new encryption key and saved to:', KEY_FILE);
    console.log('⚠️  IMPORTANT: Keep this key file secure! If lost, encrypted SSH credentials cannot be recovered.');
    
    return Buffer.from(newKey, 'hex');
  } catch (error) {
    console.error('Failed to generate or save encryption key:', error);
    throw new Error('Failed to initialize encryption key. Please check file system permissions.');
  }
}

/**
 * Get the encryption key (cached version for performance)
 * The key is loaded once and cached in memory
 */
let cachedKey = null;
function getEncryptionKey() {
  if (!cachedKey) {
    cachedKey = getOrCreateEncryptionKey();
  }
  return cachedKey;
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
