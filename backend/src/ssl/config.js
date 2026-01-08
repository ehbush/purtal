import https from 'https';
import fs from 'fs';
import crypto from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import acme from 'acme-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get SSL options for HTTPS server
 */
export async function getSSLOptions() {
  const sslMode = process.env.SSL_MODE || 'none';
  
  if (sslMode === 'none') {
    return null; // No SSL
  }
  
  if (sslMode === 'custom') {
    return getCustomCertOptions();
  }
  
  if (sslMode === 'letsencrypt') {
    return await getLetsEncryptOptions();
  }
  
  throw new Error(`Invalid SSL_MODE: ${sslMode}. Must be 'none', 'custom', or 'letsencrypt'`);
}

/**
 * Get SSL options from custom certificate files
 */
function getCustomCertOptions() {
  const certPath = process.env.SSL_CERT_PATH;
  const keyPath = process.env.SSL_KEY_PATH;
  const caPath = process.env.SSL_CA_PATH; // Optional CA bundle
  
  if (!certPath || !keyPath) {
    throw new Error('SSL_CERT_PATH and SSL_KEY_PATH must be set when SSL_MODE=custom');
  }
  
  if (!existsSync(certPath)) {
    throw new Error(`SSL certificate file not found: ${certPath}`);
  }
  
  if (!existsSync(keyPath)) {
    throw new Error(`SSL key file not found: ${keyPath}`);
  }
  
  const options = {
    cert: readFileSync(certPath, 'utf8'),
    key: readFileSync(keyPath, 'utf8')
  };
  
  if (caPath && existsSync(caPath)) {
    options.ca = readFileSync(caPath, 'utf8');
  }
  
  return options;
}

/**
 * Get or create Let's Encrypt certificate
 */
async function getLetsEncryptOptions() {
  const domain = process.env.LETSENCRYPT_DOMAIN;
  const email = process.env.LETSENCRYPT_EMAIL;
  const certDir = process.env.LETSENCRYPT_CERT_DIR || join(__dirname, '../../../certs');
  
  if (!domain) {
    throw new Error('LETSENCRYPT_DOMAIN must be set when SSL_MODE=letsencrypt');
  }
  
  if (!email) {
    throw new Error('LETSENCRYPT_EMAIL must be set when SSL_MODE=letsencrypt');
  }
  
  // Ensure cert directory exists
  if (!existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }
  
  const certPath = join(certDir, `${domain}.crt`);
  const keyPath = join(certDir, `${domain}.key`);
  
  // Check if certificate already exists and is valid
  if (existsSync(certPath) && existsSync(keyPath)) {
    const cert = readFileSync(certPath, 'utf8');
    const key = readFileSync(keyPath, 'utf8');
    
    // Check if certificate is still valid (not expired)
    if (isCertValid(cert)) {
      console.log(`Using existing Let's Encrypt certificate for ${domain}`);
      return { cert, key };
    } else {
      console.log(`Certificate expired, renewing...`);
    }
  }
  
  // Create or renew certificate
  console.log(`Obtaining Let's Encrypt certificate for ${domain}...`);
  const { cert, key } = await obtainLetsEncryptCert(domain, email, certDir);
  
  // Save certificate and key
  fs.writeFileSync(certPath, cert);
  fs.writeFileSync(keyPath, key);
  
  console.log(`Let's Encrypt certificate obtained and saved for ${domain}`);
  return { cert, key };
}

/**
 * Obtain Let's Encrypt certificate
 */
async function obtainLetsEncryptCert(domain, email, certDir) {
  const isProduction = process.env.LETSENCRYPT_PRODUCTION !== 'false';
  const acmeDirectoryUrl = isProduction
    ? acme.directory.letsencrypt.production
    : acme.directory.letsencrypt.staging;
  
  const client = new acme.Client({
    directoryUrl: acmeDirectoryUrl,
    accountKey: await getOrCreateAccountKey(email, certDir)
  });
  
  // Create order
  const [key, csr] = await acme.crypto.createCsr({
    commonName: domain,
    altNames: process.env.LETSENCRYPT_ALT_NAMES 
      ? process.env.LETSENCRYPT_ALT_NAMES.split(',').map(s => s.trim())
      : []
  });
  
  const order = await client.createOrder({
    identifiers: [{ type: 'dns', value: domain }]
  });
  
  // Get authorizations
  const authorizations = await client.getAuthorizations(order);
  
  // Complete HTTP-01 challenge
  for (const authz of authorizations) {
    const challenge = authz.challenges.find(c => c.type === 'http-01');
    const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
    
    // Store challenge for HTTP-01 validation
    // This should be served at /.well-known/acme-challenge/<token>
    const challengePath = join(certDir, 'challenge', challenge.token);
    const challengeDir = dirname(challengePath);
    if (!existsSync(challengeDir)) {
      fs.mkdirSync(challengeDir, { recursive: true });
    }
    fs.writeFileSync(challengePath, keyAuthorization);
    
    // Verify challenge
    await client.verifyChallenge(authz, challenge);
    await client.completeChallenge(challenge);
    await client.waitForValidStatus(challenge);
  }
  
  // Finalize order
  await client.finalizeOrder(order, csr);
  const cert = await client.getCertificate(order);
  
  return { cert, key: key.toString() };
}

/**
 * Get or create ACME account key
 */
async function getOrCreateAccountKey(email, certDir) {
  const keyPath = join(certDir, 'account.key');
  
  if (existsSync(keyPath)) {
    return readFileSync(keyPath, 'utf8');
  }
  
  const accountKey = await acme.crypto.createPrivateKey();
  fs.writeFileSync(keyPath, accountKey.toString());
  
  return accountKey;
}

/**
 * Check if certificate is still valid (not expired)
 */
function isCertValid(cert) {
  try {
    const certInfo = crypto.x509Certificate ? 
      new crypto.x509Certificate(cert) :
      null;
    
    if (certInfo) {
      // Node.js 15.6.0+ with x509Certificate
      const notAfter = new Date(certInfo.validTo);
      const now = new Date();
      const daysUntilExpiry = (notAfter - now) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry > 30;
    } else {
      // Fallback: parse certificate manually
      const match = cert.match(/Not After\s*:\s*(.+)/);
      if (match) {
        const notAfter = new Date(match[1]);
        const now = new Date();
        const daysUntilExpiry = (notAfter - now) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 30;
      }
      // If we can't parse it, assume it's valid and let renewal happen if needed
      return true;
    }
  } catch (error) {
    console.error('Error validating certificate:', error);
    // If validation fails, assume we need a new certificate
    return false;
  }
}

/**
 * Setup HTTP-01 challenge route handler
 * This should be called to serve ACME challenges
 */
export function setupAcmeChallenge(app, certDir) {
  const challengeDir = join(certDir || join(__dirname, '../../../certs'), 'challenge');
  
  app.get('/.well-known/acme-challenge/:token', (req, res) => {
    const token = req.params.token;
    const challengePath = join(challengeDir, token);
    
    if (existsSync(challengePath)) {
      const keyAuthorization = readFileSync(challengePath, 'utf8');
      res.type('text/plain');
      res.send(keyAuthorization);
    } else {
      res.status(404).send('Challenge not found');
    }
  });
}
