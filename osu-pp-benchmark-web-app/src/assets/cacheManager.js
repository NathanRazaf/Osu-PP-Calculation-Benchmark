// cacheManager.js
export const CACHE_EXPIRY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

export class CacheManager {
  constructor(storageKey = 'comparisonGraphCache') {
    this.storageKey = storageKey;
  }

  // Get the entire cache object from localStorage
  getCache() {
    const cache = localStorage.getItem(this.storageKey);
    return cache ? JSON.parse(cache) : {};
  }

  // Save the entire cache object to localStorage
  saveCache(cache) {
    localStorage.setItem(this.storageKey, JSON.stringify(cache));
  }

  // Get cached data for a specific identifier
  getCachedData(identifier, isUsername) {
    const cache = this.getCache();
    const key = `${isUsername ? 'user' : 'beatmap'}-${identifier}`;
    return cache[key];
  }

  // Save data for a specific identifier
  saveData(identifier, isUsername, data) {
    const cache = this.getCache();
    const key = `${isUsername ? 'user' : 'beatmap'}-${identifier}`;
    cache[key] = {
      data,
      timestamp: Date.now()
    };
    this.saveCache(cache);
  }

  // Check if cached data exists and is still valid
  isDataValid(identifier, isUsername) {
    const cachedData = this.getCachedData(identifier, isUsername);
    if (!cachedData) return false;
    
    const mandatoryLength = isUsername ? 100 : 50;
    const timeDiff = Date.now() - cachedData.timestamp;
    return timeDiff < CACHE_EXPIRY_TIME && cachedData.data.length >= mandatoryLength;
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const cache = this.getCache();
    const now = Date.now();
    
    Object.keys(cache).forEach(key => {
      const timeDiff = now - cache[key].timestamp;
      if (timeDiff >= CACHE_EXPIRY_TIME) {
        delete cache[key];
      }
    });
    
    this.saveCache(cache);
  }
}