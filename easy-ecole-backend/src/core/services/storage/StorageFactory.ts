import { StorageInterface } from "./StorageInterface";
import { LocalStorageService } from "./LocalStorageService";

const DEFAULT_LOCATION = "local";

const _registry: Map<string, StorageInterface> = new Map();

_registry.set(DEFAULT_LOCATION, new LocalStorageService());

export class StorageFactory {
  static getStorage(location: string = DEFAULT_LOCATION): StorageInterface {
    const storage = _registry.get(location);
    if (!storage) {
      throw new Error(`No storage registered for location: ${location}`);
    }
    return storage;
  }

  static registerStorage(
    location: string,
    storage: StorageInterface
  ): void {
    _registry.set(location, storage);
  }

  static hasStorage(location: string): boolean {
    return _registry.has(location);
  }

  static reset(): void {
    _registry.clear();
    _registry.set(DEFAULT_LOCATION, new LocalStorageService());
  }
}
