/**
 * cacheService.js — Simple in-memory TTL cache
 * Reduces redundant DB queries for rarely-changing data.
 *
 * Usage:
 *   const cache = require('./cacheService');
 *   const data = await cache.getOrSet('key', fetchFn, ttlSeconds);
 *   cache.invalidate('key');          // single key
 *   cache.invalidatePrefix('dash');   // all keys starting with 'dash'
 */

class CacheService {
  constructor() {
    /** @type {Map<string, { data: any, expiresAt: number }>} */
    this.store = new Map();
  }

  /**
   * Get cached value or fetch and cache it.
   * @param {string} key      - Cache key
   * @param {() => Promise<any>} fetchFn - Async function to fetch data if cache miss
   * @param {number} ttlSeconds - Time-to-live in seconds (default: 300 = 5 min)
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    const cached = this.store.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const data = await fetchFn();
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return data;
  }

  /**
   * Get cached value (returns undefined on miss or expiry).
   */
  get(key) {
    const cached = this.store.get(key);
    if (!cached || Date.now() >= cached.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return cached.data;
  }

  /**
   * Set a cache entry manually.
   */
  set(key, data, ttlSeconds = 300) {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate a single cache key.
   */
  invalidate(key) {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys starting with a given prefix.
   */
  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear entire cache.
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get cache stats (for debugging).
   */
  stats() {
    let active = 0;
    const now = Date.now();
    for (const entry of this.store.values()) {
      if (now < entry.expiresAt) active++;
    }
    return { total: this.store.size, active };
  }
}

// Singleton instance
module.exports = new CacheService();
