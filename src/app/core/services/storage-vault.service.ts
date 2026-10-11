import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const DB_NAME = 'madrasati_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'vault_assets';

@Injectable({
  providedIn: 'root',
})
export class StorageVaultService {
  private readonly platformId = inject(PLATFORM_ID);
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private readonly memoryFallback = new Map<string, unknown>();

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getDB(): Promise<IDBDatabase | null> {
    if (!this.isBrowser) {
      return Promise.resolve(null);
    }
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        if (typeof window === 'undefined' || !window.indexedDB) {
          resolve(null);
          return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('StorageVaultService: IndexedDB open failed, falling back to in-memory.');
          resolve(null);
        };
      } catch (e) {
        console.warn('StorageVaultService: IndexedDB initialization error:', e);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Save a heavy asset (JSON, Base64 image, OCR blob) into IndexedDB.
   */
  async saveAsset<T>(key: string, data: T): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const db = await this.getDB();
      if (!db) {
        this.memoryFallback.set(key, data);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`StorageVaultService: Failed to save asset "${key}":`, err);
      this.memoryFallback.set(key, data);
    }
  }

  /**
   * Retrieve a heavy asset from IndexedDB.
   */
  async getAsset<T>(key: string): Promise<T | null> {
    if (!this.isBrowser) return null;

    try {
      const db = await this.getDB();
      if (!db) {
        return (this.memoryFallback.get(key) as T) || null;
      }

      return await new Promise<T | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve(req.result !== undefined ? (req.result as T) : null);
        };
        req.onerror = () => {
          resolve((this.memoryFallback.get(key) as T) || null);
        };
      });
    } catch (err) {
      console.warn(`StorageVaultService: Failed to get asset "${key}":`, err);
      return (this.memoryFallback.get(key) as T) || null;
    }
  }

  /**
   * Delete an asset from IndexedDB.
   */
  async deleteAsset(key: string): Promise<void> {
    this.memoryFallback.delete(key);
    if (!this.isBrowser) return;

    try {
      const db = await this.getDB();
      if (!db) return;

      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (err) {
      console.warn(`StorageVaultService: Failed to delete asset "${key}":`, err);
    }
  }

  // ==========================================
  // LIGHTWEIGHT METADATA LAYER (localStorage)
  // ==========================================

  getMeta<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  setMeta<T>(key: string, value: T): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`StorageVaultService: localStorage quota exceeded for key "${key}":`, err);
    }
  }

  removeMeta(key: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // safe no-op
    }
  }
}
