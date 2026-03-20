// Reference: http://lollyrock.com/articles/nodejs-encryption
import crypto from 'crypto';
import { EncryptedPassword } from '../../common/types/server';

const algorithm = 'aes-256-cbc';

export function encrypt(plainText: string, secret: string): EncryptedPassword {
  if (!plainText) {
    throw new Error('Missing plain text');
  } else if (!secret) {
    throw new Error('Missing encrypt secret');
  }
  let key = Buffer.alloc(32);
  key = Buffer.concat([Buffer.from(secret)], key.length);
  const ivBytes = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, ivBytes);
  return {
    ivText: ivBytes.toString('base64'),
    encryptedText: cipher.update(plainText, 'utf8', 'base64') + cipher.final('base64'),
  };
}

export function decrypt(encrypted: EncryptedPassword, secret: string): string {
  if (!encrypted || !encrypted.ivText || !encrypted.encryptedText) {
    throw new Error('Invalid encrypted valued');
  } else if (!secret) {
    throw new Error('Missing decrypt secret');
  }

  const iv = Buffer.from(encrypted.ivText, 'base64');
  let key = Buffer.alloc(32);
  key = Buffer.concat([Buffer.from(secret)], key.length);

  if (iv.length !== 16) {
    throw new Error('The encrypted value is not a valid format');
  }

  if (key.length !== 32) {
    throw new Error('The secret is not valid format');
  }

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return decipher.update(encrypted.encryptedText, 'base64', 'utf8') + decipher.final('utf8');
}

/**
 * Decrypts a value using the insecure createDecipher method.
 *
 * This method should not be used and only exists to give an upgrade path
 * of existing sqlectron-db-core users to the much better iv functions above.
 *
 * @deprecated 8.1.0
 * @param {string} text
 * @param {string} secret
 */
export function unsafeDecrypt(text: string, secret: string): string {
  if (!secret) {
    throw new Error('Missing crypto secret');
  }

  // Replicate the key derivation that the removed crypto.createDecipher
  // used internally (EVP_BytesToKey with MD5, no salt).
  // aes-256-ctr requires a 32-byte key and 16-byte IV.
  const keyLen = 32;
  const ivLen = 16;
  const totalLen = keyLen + ivLen;
  const parts: Buffer[] = [];
  let lastHash = Buffer.alloc(0);
  while (Buffer.concat(parts).length < totalLen) {
    lastHash = crypto
      .createHash('md5')
      .update(Buffer.concat([lastHash, Buffer.from(secret)]))
      .digest();
    parts.push(lastHash);
  }
  const derived = Buffer.concat(parts, totalLen);
  const key = derived.subarray(0, keyLen);
  const iv = derived.subarray(keyLen, totalLen);

  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
  return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
}
