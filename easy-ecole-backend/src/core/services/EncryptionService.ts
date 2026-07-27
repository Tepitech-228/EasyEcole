import crypto from "crypto";
import fs from "fs";
import path from "path";

const KEY_DIR = path.resolve(process.cwd(), ".keys");
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getMasterKey(): Buffer {
  const envKey = process.env.ENCRYPTION_MASTER_KEY;
  if (envKey) {
    return Buffer.from(envKey, "hex");
  }
  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }
  const masterKeyPath = path.join(KEY_DIR, "master.key");
  if (fs.existsSync(masterKeyPath)) {
    return fs.readFileSync(masterKeyPath);
  }
  const key = crypto.randomBytes(KEY_LENGTH);
  fs.writeFileSync(masterKeyPath, key, { mode: 0o600 });
  return key;
}

export class EncryptionService {
  static generateKey(): { keyId: string; key: Buffer } {
    const keyId = crypto.randomUUID();
    const key = crypto.randomBytes(KEY_LENGTH);
    this._saveKey(keyId, key);
    return { keyId, key };
  }

  static encrypt(
    buffer: Buffer,
    key: Buffer
  ): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { encrypted, iv, authTag };
  }

  static decrypt(
    encrypted: Buffer,
    key: Buffer,
    iv: Buffer,
    authTag: Buffer
  ): Buffer {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  static async encryptFile(
    filePath: string,
    keyId?: string
  ): Promise<{ keyId: string; encryptedPath: string }> {
    const buffer = fs.readFileSync(filePath);
    let key: Buffer;
    if (keyId) {
      key = this._loadKey(keyId);
    } else {
      const generated = this.generateKey();
      key = generated.key;
      keyId = generated.keyId;
    }
    const { encrypted, iv, authTag } = this.encrypt(buffer, key);
    const encryptedPath = filePath + ".enc";
    const header = Buffer.concat([iv, authTag, encrypted]);
    fs.writeFileSync(encryptedPath, header);
    return { keyId, encryptedPath };
  }

  static async decryptFile(
    encryptedPath: string,
    keyId: string
  ): Promise<Buffer> {
    const key = this._loadKey(keyId);
    const data = fs.readFileSync(encryptedPath);
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    return this.decrypt(encrypted, key, iv, authTag);
  }

  static loadKey(keyId: string): Buffer {
    return this._loadKey(keyId);
  }

  private static _saveKey(keyId: string, key: Buffer): void {
    if (!fs.existsSync(KEY_DIR)) {
      fs.mkdirSync(KEY_DIR, { recursive: true });
    }
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(key), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const payload = Buffer.concat([iv, authTag, encrypted]);
    fs.writeFileSync(path.join(KEY_DIR, `${keyId}.key`), payload, { mode: 0o600 });
  }

  private static _loadKey(keyId: string): Buffer {
    const masterKey = getMasterKey();
    const keyPath = path.join(KEY_DIR, `${keyId}.key`);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Key not found: ${keyId}`);
    }
    const data = fs.readFileSync(keyPath);
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}
