import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error('❌ ERROR: ENCRYPTION_KEY not set in .env');
}

export function encryptSecret(secret) {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not configured');
  }
  
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
}

export function decryptSecret(encryptedData) {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not configured');
  }
  
  const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}