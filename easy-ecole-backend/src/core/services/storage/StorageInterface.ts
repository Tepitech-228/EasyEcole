export interface StorageOptions {
  encrypt?: boolean;
  keyId?: string;
  subdirectory?: string;
}

export interface StorageResult {
  path: string;
  storageLocation: string;
  isEncrypted: boolean;
  keyId?: string;
  integrityHash: string;
  size: number;
}

export interface StorageInterface {
  store(
    filename: string,
    buffer: Buffer,
    options?: StorageOptions
  ): Promise<StorageResult>;

  retrieve(filePath: string): Promise<Buffer>;

  delete(filePath: string): Promise<void>;

  exists(filePath: string): Promise<boolean>;

  getUrl(filePath: string): string;

  copyTo(
    filePath: string,
    targetStorage: StorageInterface
  ): Promise<string>;
}
