import { EnhancedEventInfo, CacheEntry, CacheStatistics, DataFreshness } from '../types';

// 多層キャッシュシステム実装
export class EventCache {
  private memoryCache: Map<string, CacheEntry<EnhancedEventInfo[]>> = new Map();
  private localStoragePrefix = 'iwate-events-cache-';
  private indexedDBName = 'IwateEventsDB';
  private indexedDBVersion = 1;
  private db: IDBDatabase | null = null;
  
  // Cache configuration
  private readonly memoryCacheMaxSize = 50; // MB in terms of entries
  private readonly localStorageMaxSize = 10 * 1024 * 1024; // 10MB in bytes
  private readonly indexedDBMaxSize = 100 * 1024 * 1024; // 100MB in bytes

  private statistics: CacheStatistics = {
    hitRate: 0,
    missCount: 0,
    evictionCount: 0,
    currentSize: 0,
    maxSize: this.memoryCacheMaxSize,
    averageAccessTime: 0
  };

  constructor() {
    this.initializeIndexedDB();
    this.setupCleanupInterval();
  }

  // Layer 1: Memory Cache (Fastest)
  public async getFromMemory(key: string): Promise<EnhancedEventInfo[] | null> {
    const startTime = performance.now();
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.statistics.missCount++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.memoryCache.delete(key);
      this.statistics.missCount++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    const accessTime = performance.now() - startTime;
    this.updateAverageAccessTime(accessTime);
    this.updateHitRate(true);
    
    return entry.data;
  }

  public async setInMemory(
    key: string, 
    data: EnhancedEventInfo[], 
    ttl: number = 3600000 // 1 hour default
  ): Promise<void> {
    // Enforce memory cache size limit
    if (this.memoryCache.size >= this.memoryCacheMaxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<EnhancedEventInfo[]> = {
      key,
      data,
      timestamp: new Date(),
      ttl,
      accessCount: 0,
      lastAccessed: new Date()
    };

    this.memoryCache.set(key, entry);
    this.statistics.currentSize = this.memoryCache.size;
  }

  // Layer 2: LocalStorage Cache (Fast)
  public async getFromLocalStorage(key: string): Promise<EnhancedEventInfo[] | null> {
    try {
      const storageKey = this.localStoragePrefix + key;
      const cached = localStorage.getItem(storageKey);
      
      if (!cached) {
        this.statistics.missCount++;
        return null;
      }

      const entry: CacheEntry<EnhancedEventInfo[]> = JSON.parse(cached);
      
      // Check TTL
      if (Date.now() - new Date(entry.timestamp).getTime() > entry.ttl) {
        localStorage.removeItem(storageKey);
        this.statistics.missCount++;
        return null;
      }

      this.updateHitRate(true);
      
      // Also cache in memory for faster subsequent access
      await this.setInMemory(key, entry.data, entry.ttl);
      
      return entry.data;
      
    } catch (error) {
      console.error('LocalStorage cache error:', error);
      this.statistics.missCount++;
      return null;
    }
  }

  public async setInLocalStorage(
    key: string, 
    data: EnhancedEventInfo[], 
    ttl: number = 86400000 // 24 hours default
  ): Promise<void> {
    try {
      const entry: CacheEntry<EnhancedEventInfo[]> = {
        key,
        data,
        timestamp: new Date(),
        ttl,
        accessCount: 0,
        lastAccessed: new Date()
      };

      const storageKey = this.localStoragePrefix + key;
      const serialized = JSON.stringify(entry);
      
      // Check size limit
      if (serialized.length > this.localStorageMaxSize) {
        console.warn('Data too large for LocalStorage cache');
        return;
      }

      // Check total storage usage and clean if necessary
      await this.cleanLocalStorageIfNeeded();
      
      localStorage.setItem(storageKey, serialized);
      
    } catch (error) {
      console.error('LocalStorage cache set error:', error);
      // Try to clean up and retry once
      await this.cleanLocalStorageIfNeeded();
      try {
        localStorage.setItem(this.localStoragePrefix + key, JSON.stringify({
          key, data, timestamp: new Date(), ttl, accessCount: 0, lastAccessed: new Date()
        }));
      } catch (retryError) {
        console.error('LocalStorage cache retry failed:', retryError);
      }
    }
  }

  // Layer 3: IndexedDB Cache (Large capacity)
  public async getFromIndexedDB(key: string): Promise<EnhancedEventInfo[] | null> {
    if (!this.db) {
      await this.initializeIndexedDB();
      if (!this.db) return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;
        
        if (!entry) {
          this.statistics.missCount++;
          resolve(null);
          return;
        }

        // Check TTL
        if (Date.now() - new Date(entry.timestamp).getTime() > entry.ttl) {
          // Delete expired entry
          const deleteTransaction = this.db!.transaction(['events'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('events');
          deleteStore.delete(key);
          
          this.statistics.missCount++;
          resolve(null);
          return;
        }

        this.updateHitRate(true);
        
        // Cache in faster layers for subsequent access
        this.setInLocalStorage(key, entry.data, entry.ttl);
        this.setInMemory(key, entry.data, Math.min(entry.ttl, 3600000));
        
        resolve(entry.data);
      };

      request.onerror = () => {
        console.error('IndexedDB get error:', request.error);
        this.statistics.missCount++;
        resolve(null);
      };
    });
  }

  public async setInIndexedDB(
    key: string, 
    data: EnhancedEventInfo[], 
    ttl: number = 604800000 // 7 days default
  ): Promise<void> {
    if (!this.db) {
      await this.initializeIndexedDB();
      if (!this.db) return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      
      const entry: CacheEntry<EnhancedEventInfo[]> = {
        key,
        data,
        timestamp: new Date(),
        ttl,
        accessCount: 0,
        lastAccessed: new Date()
      };

      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('IndexedDB set error:', request.error);
        reject(request.error);
      };
    });
  }

  // High-level cache operations
  public async get(key: string): Promise<EnhancedEventInfo[] | null> {
    // Try memory cache first (fastest)
    let result = await this.getFromMemory(key);
    if (result) return result;

    // Try LocalStorage cache second
    result = await this.getFromLocalStorage(key);
    if (result) return result;

    // Try IndexedDB cache last (slowest but largest)
    result = await this.getFromIndexedDB(key);
    if (result) return result;

    return null;
  }

  public async set(
    key: string, 
    data: EnhancedEventInfo[], 
    options: {
      memoryTTL?: number;
      localStorageTTL?: number;
      indexedDBTTL?: number;
      skipMemory?: boolean;
      skipLocalStorage?: boolean;
      skipIndexedDB?: boolean;
    } = {}
  ): Promise<void> {
    const {
      memoryTTL = 3600000,      // 1 hour
      localStorageTTL = 86400000, // 24 hours
      indexedDBTTL = 604800000,   // 7 days
      skipMemory = false,
      skipLocalStorage = false,
      skipIndexedDB = false
    } = options;

    // Store in all layers by default
    const promises: Promise<void>[] = [];

    if (!skipMemory) {
      promises.push(this.setInMemory(key, data, memoryTTL));
    }
    
    if (!skipLocalStorage) {
      promises.push(this.setInLocalStorage(key, data, localStorageTTL));
    }
    
    if (!skipIndexedDB) {
      promises.push(this.setInIndexedDB(key, data, indexedDBTTL));
    }

    await Promise.allSettled(promises);
  }

  // Cache management operations
  public async invalidate(key: string): Promise<void> {
    // Remove from all cache layers
    this.memoryCache.delete(key);
    
    try {
      localStorage.removeItem(this.localStoragePrefix + key);
    } catch (error) {
      console.error('LocalStorage invalidation error:', error);
    }

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(['events'], 'readwrite');
        const store = transaction.objectStore('events');
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('IndexedDB invalidation error:', request.error);
          resolve(); // Continue even if deletion fails
        };
      });
    }
  }

  public async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.statistics.currentSize = 0;
    this.statistics.evictionCount = 0;

    // Clear LocalStorage cache
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.localStoragePrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear IndexedDB cache
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(['events'], 'readwrite');
        const store = transaction.objectStore('events');
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('IndexedDB clear error:', request.error);
          resolve();
        };
      });
    }
  }

  public getStatistics(): CacheStatistics {
    return { ...this.statistics };
  }

  // Private helper methods
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.indexedDBName, this.indexedDBVersion);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('events')) {
          const store = db.createObjectStore('events', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  private evictLeastRecentlyUsed(): void {
    if (this.memoryCache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.statistics.evictionCount++;
      this.statistics.currentSize = this.memoryCache.size;
    }
  }

  private async cleanLocalStorageIfNeeded(): Promise<void> {
    try {
      let totalSize = 0;
      const entries: { key: string; timestamp: Date; size: number }[] = [];

      // Calculate total size and collect entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.localStoragePrefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = value.length * 2; // Rough estimate (UTF-16)
            totalSize += size;
            
            try {
              const entry = JSON.parse(value);
              entries.push({
                key,
                timestamp: new Date(entry.timestamp),
                size
              });
            } catch {
              // Remove invalid entries
              localStorage.removeItem(key);
            }
          }
        }
      }

      // Clean up if over 80% of limit
      if (totalSize > this.localStorageMaxSize * 0.8) {
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        // Remove oldest 25% of entries
        const toRemove = Math.ceil(entries.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
          localStorage.removeItem(entries[i].key);
        }
      }
    } catch (error) {
      console.error('LocalStorage cleanup error:', error);
    }
  }

  private updateHitRate(isHit: boolean): void {
    const totalRequests = this.statistics.missCount + (isHit ? 1 : 0);
    if (totalRequests > 0) {
      const hits = totalRequests - this.statistics.missCount;
      this.statistics.hitRate = hits / totalRequests;
    }
  }

  private updateAverageAccessTime(accessTime: number): void {
    // Simple moving average
    this.statistics.averageAccessTime = 
      (this.statistics.averageAccessTime * 0.9) + (accessTime * 0.1);
  }

  private setupCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private cleanExpiredEntries(): void {
    // Clean memory cache
    const now = Date.now();
    for (const [key, entry] of this.memoryCache) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
    this.statistics.currentSize = this.memoryCache.size;
  }
}

// Singleton instance
export const eventCache = new EventCache();