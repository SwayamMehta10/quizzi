import { createClient } from "@/utils/supabase/client";

/**
 * Simplified data fetchers without caching (auth issues resolved)
 */
export class OptimizedQueries {
  
  /**
   * Get minimal user profile data
   */
  static async getUserProfile(userId: string) {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, gender')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Get challenges with minimal data, paginated
   */
  static async getChallengesOptimized(userId: string, limit = 20, offset = 0) {
    const supabase = createClient();
    
    try {
      // Get challenge IDs first
      const { data: challengeIds, error: challengeError } = await supabase
        .from("challenges")
        .select("challenge_id, challenger_id, opponent_id, challenger_status, opponent_status, created_at, topic_id")
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (challengeError) {
        console.error('Error fetching challenges:', challengeError);
        return [];
      }

      if (!challengeIds?.length) return [];

      // Get challenger and opponent profile data
      const userIds = [...new Set([
        ...challengeIds.map((c: any) => c.challenger_id),
        ...challengeIds.map((c: any) => c.opponent_id)
      ])];

      const [profilesResult, topicsResult] = await Promise.all([
        supabase.from("profiles").select("id, username, avatar_url, gender").in("id", userIds),
        supabase.from("topics").select("topic_id, name, icon_url").in("topic_id", challengeIds.map((c: any) => c.topic_id))
      ]);

      const { data: profiles } = profilesResult;
      const { data: topics } = topicsResult;

      // Combine the data
      const challenges = challengeIds.map((challenge: any) => ({
        ...challenge,
        challenger: profiles?.find((p: any) => p.id === challenge.challenger_id),
        opponent: profiles?.find((p: any) => p.id === challenge.opponent_id),
        topic: topics?.find((t: any) => t.topic_id === challenge.topic_id)
      }));

      return challenges;
    } catch (error) {
      console.error('Error in getChallengesOptimized:', error);
      return [];
    }
  }

  /**
   * Get friends list
   */
  static async getFriendsOptimized(userId: string) {
    const supabase = createClient();
    
    try {
      // Get friend relationships only
      const { data: friendships, error: friendshipError } = await supabase
        .from("friends")
        .select("user_id1, user_id2")
        .or(`user_id1.eq.${userId}, user_id2.eq.${userId}`);

      if (friendshipError) {
        console.error('Error fetching friendships:', friendshipError);
        return [];
      }

      if (!friendships?.length) return [];

      // Get friend IDs
      const friendIds = friendships.map((row: any) => 
        row.user_id1 === userId ? row.user_id2 : row.user_id1
      );

      // Get minimal profile data
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, gender")
        .in("id", friendIds);

      if (profileError) {
        console.error('Error fetching friend profiles:', profileError);
        return [];
      }

      return profiles || [];
    } catch (error) {
      console.error('Error in getFriendsOptimized:', error);
      return [];
    }
  }

  /**
   * Get pending friend requests
   */
  static async getPendingRequestsOptimized(userId: string) {
    const supabase = createClient();
    
    try {
      // Get pending requests first, then get profile data separately for type safety
      const { data: requests, error: requestError } = await supabase
        .from("friend_requests")
        .select("sender_id")
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (requestError) {
        console.error('Error fetching friend requests:', requestError);
        return [];
      }

      if (!requests?.length) return [];

      // Get sender profile data
      const senderIds = requests.map((req: any) => req.sender_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, gender")
        .in("id", senderIds);
      
      if (profileError) {
        console.error('Error fetching sender profiles:', profileError);
        return [];
      }
      
      return profiles || [];
    } catch (error) {
      console.error('Error in getPendingRequestsOptimized:', error);
      return [];
    }
  }

  /**
   * Get topics
   */
  static async getTopicsOptimized() {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('topic_id, name, icon_url')
        .order('name');

      if (error) {
        console.error('Error fetching topics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopicsOptimized:', error);
      return [];
    }
  }
}
