// Simple in-memory cache for high-traffic scenarios
// In production, replace with Redis or similar

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 1000; // Limit cache size
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired items
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const cache = new MemoryCache();

// Auto-cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => cache.cleanup(), 10 * 60 * 1000);
}

// Cache wrapper for API responses
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = cache.get<T>(key);
      if (cached !== null) {
        resolve(cached);
        return;
      }

      // Fetch fresh data
      const data = await fetcher();
      cache.set(key, data, ttl);
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

// Rate limiting for API endpoints
class RateLimiter {
  private requests = new Map<string, number[]>();
  private windowMs = 60 * 1000; // 1 minute window
  private maxRequests = 100; // 100 requests per minute

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter((time: number) => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  // Cleanup old entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.requests.forEach((requests, key) => {
      const validRequests = requests.filter((time: number) => now - time < this.windowMs);
      if (validRequests.length === 0) {
        keysToDelete.push(key);
      } else {
        this.requests.set(key, validRequests);
      }
    });
    
    keysToDelete.forEach(key => this.requests.delete(key));
  }
}

export const rateLimiter = new RateLimiter();

// Auto-cleanup rate limiter every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
