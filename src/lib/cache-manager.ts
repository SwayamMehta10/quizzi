/**
 * Client-side cache manager for gameplay data only
 * Used to reduce Supabase API calls during gameplay
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class GameplayCacheManager {
  private cache = new Map<string, CacheItem<unknown>>();

  set<T>(key: string, data: T, ttlMinutes = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache keys for gameplay only - NO AUTH CACHING
export const gameplayCacheKeys = {
  // Game-related data only
  questions: (challengeId: string) => `game:questions:${challengeId}`,
  challengeResults: (challengeId: string) => `game:results:${challengeId}`,
  leaderboard: (topicId: string) => `game:leaderboard:${topicId}`,
  topics: 'game:topics', // Only for topic selection
  // DO NOT cache user auth or profile data
};

export const gameplayCache = new GameplayCacheManager();
