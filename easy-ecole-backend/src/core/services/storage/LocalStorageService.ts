import fs from "fs";
import path from "path";
import crypto from "crypto";
import { StorageInterface, StorageOptions, StorageResult } from "./StorageInterface";
import { EncryptionService } from "../EncryptionService";
import { GED_CONFIG } from "../../config/GedConfig";

const DEFAULT_STORAGE_DIR = GED_CONFIG.STORAGE_DIR;

export class LocalStorageService implements StorageInterface {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(
      process.cwd(),
      baseDir || DEFAULT_STORAGE_DIR
    );
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  async store(
    filename: string,
    buffer: Buffer,
    options?: StorageOptions
  ): Promise<StorageResult> {
    let targetDir = this.baseDir;

    if (options?.subdirectory) {
      targetDir = path.join(targetDir, options.subdirectory);
    } else {
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      targetDir = path.join(targetDir, year, month);
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);
    let storagePath = path.relative(this.baseDir, filePath);

    let isEncrypted = false;
    let keyId: string | undefined;

    if (options?.encrypt) {
      if (!options.keyId) {
        const generated = EncryptionService.generateKey();
        keyId = generated.keyId;
      } else {
        keyId = options.keyId;
      }

      const key = EncryptionService.loadKey(keyId);
      const { encrypted, iv, authTag } = EncryptionService.encrypt(buffer, key);
      const header = Buffer.concat([iv, authTag, encrypted]);

      const encPath = filePath + ".enc";
      fs.writeFileSync(encPath, header);

      const meta = JSON.stringify({ keyId });
      fs.writeFileSync(filePath + ".enc.meta", meta);

      storagePath = path.relative(this.baseDir, encPath);
      isEncrypted = true;
    } else {
      fs.writeFileSync(filePath, buffer);
    }

    const fileToStat = isEncrypted ? filePath + ".enc" : filePath;
    const stats = fs.statSync(fileToStat);
    const hashBuffer = isEncrypted
      ? fs.readFileSync(fileToStat)
      : buffer;
    const integrityHash = crypto
      .createHash("sha256")
      .update(hashBuffer)
      .digest("hex");

    return {
      path: storagePath.replace(/\\/g, "/"),
      storageLocation: this.baseDir,
      isEncrypted,
      keyId,
      integrityHash,
      size: stats.size,
    };
  }

  async retrieve(filePath: string): Promise<Buffer> {
    const fullPath = path.resolve(this.baseDir, filePath);
    const encryptedPath = fullPath + ".enc";

    if (fs.existsSync(encryptedPath)) {
      const keyId = this._readKeyId(filePath);
      return EncryptionService.decryptFile(encryptedPath, keyId);
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return fs.readFileSync(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.resolve(this.baseDir, filePath);

    for (const suffix of ["", ".enc", ".enc.meta"]) {
      const p = fullPath + suffix;
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    }
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.resolve(this.baseDir, filePath);
    return (
      fs.existsSync(fullPath) ||
      fs.existsSync(fullPath + ".enc")
    );
  }

  getUrl(filePath: string): string {
    return `/${DEFAULT_STORAGE_DIR}/${filePath.replace(/\\/g, "/")}`;
  }

  async copyTo(
    filePath: string,
    targetStorage: StorageInterface
  ): Promise<string> {
    const buffer = await this.retrieve(filePath);
    const result = await targetStorage.store(
      path.basename(filePath),
      buffer
    );
    return result.path;
  }

  private _readKeyId(relativePath: string): string {
    const metaPath = path.resolve(this.baseDir, relativePath) + ".enc.meta";
    if (!fs.existsSync(metaPath)) {
      throw new Error(
        `Encrypted file has no metadata: ${relativePath}`
      );
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    return meta.keyId;
  }
}
