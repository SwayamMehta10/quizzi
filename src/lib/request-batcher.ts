/**
 * Request batching utility to reduce API calls and database egress
 * Combines multiple similar requests into single batched requests
 */

import { createClient } from '@/utils/supabase/client';

interface BatchedRequest<T = unknown> {
  resolve: (data: T) => void;
  reject: (error: Error) => void;
}

/**
 * Batches profile requests to reduce database hits
 * Instead of 20 individual profile calls, makes 1 batch call
 */
class ProfileBatcher {
  private pendingRequests = new Map<string, BatchedRequest[]>();
  private batchTimeout: NodeJS.Timeout | null = null;
  
  async getProfile(userId: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      // Add to pending batch
      if (!this.pendingRequests.has(userId)) {
        this.pendingRequests.set(userId, []);
      }
      this.pendingRequests.get(userId)!.push({ resolve, reject });
      
      // Schedule batch execution
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), 50); // 50ms delay
      }
    });
  }
  
  private async executeBatch() {
    const userIds = Array.from(this.pendingRequests.keys());
    const allRequests = Array.from(this.pendingRequests.values()).flat();
    
    // Clear pending requests
    this.pendingRequests.clear();
    this.batchTimeout = null;
    
    try {
      const supabase = createClient();
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, gender')
        .in('id', userIds);
      
      if (error) throw error;
      
      // Create lookup map
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);
      
      // Resolve all requests
      userIds.forEach(userId => {
        const requests = this.pendingRequests.get(userId) || [];
        const profile = profileMap.get(userId) || null;
        
        requests.forEach(req => req.resolve(profile));
      });
      
    } catch (error) {
      // Reject all requests
      const errorObj = error instanceof Error ? error : new Error('Profile batch fetch failed');
      allRequests.forEach(req => req.reject(errorObj));
    }
  }
}

/**
 * Batches topic requests
 */
class TopicBatcher {
  private pendingRequests = new Map<string, BatchedRequest[]>();
  private batchTimeout: NodeJS.Timeout | null = null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTopic(topicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.pendingRequests.has(topicId)) {
        this.pendingRequests.set(topicId, []);
      }
      this.pendingRequests.get(topicId)!.push({ resolve, reject });
      
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.executeBatch(), 50);
      }
    });
  }
  
  private async executeBatch() {
    const topicIds = Array.from(this.pendingRequests.keys());
    const allRequests = Array.from(this.pendingRequests.values()).flat();
    
    this.pendingRequests.clear();
    this.batchTimeout = null;
    
    try {
      const supabase = createClient();
      const { data: topics, error } = await supabase
        .from('topics')
        .select('topic_id, name, icon_url')
        .in('topic_id', topicIds);
      
      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topicMap = new Map(topics?.map((t: any) => [t.topic_id, t]) || []);
      
      topicIds.forEach(topicId => {
        const requests = this.pendingRequests.get(topicId) || [];
        const topic = topicMap.get(topicId) || null;
        
        requests.forEach(req => req.resolve(topic));
      });
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Topic batch fetch failed');
      allRequests.forEach(req => req.reject(errorObj));
    }
  }
}

// Global instances
const profileBatcher = new ProfileBatcher();
const topicBatcher = new TopicBatcher();

/**
 * Batched request utilities
 * These replace individual database calls with efficient batched requests
 */
export const BatchedRequests = {
  /**
   * Get profile with automatic batching
   * Reduces 20 individual calls to 1 batched call
   */
  getProfile: (userId: string) => profileBatcher.getProfile(userId),
  
  /**
   * Get topic with automatic batching
   */
  getTopic: (topicId: string) => topicBatcher.getTopic(topicId),
  
  /**
   * Batch get multiple profiles at once
   */
  async getProfiles(userIds: string[]) {
    const promises = userIds.map(id => profileBatcher.getProfile(id));
    return Promise.all(promises);
  },
  
  /**
   * Batch get multiple topics at once
   */
  async getTopics(topicIds: string[]) {
    const promises = topicIds.map(id => topicBatcher.getTopic(id));
    return Promise.all(promises);
  }
};
