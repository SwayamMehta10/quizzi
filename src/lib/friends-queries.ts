import { createClient } from "@/utils/supabase/server";
import { UserProfile } from "@/types/friends";

/**
 * Optimized database queries for friends functionality
 */
export const friendsQueries = {
  /**
   * Search users with their relationship status in a single optimized query
   */
  async searchUsersWithStatus(
    currentUserId: string, 
    searchTerm: string
  ): Promise<UserProfile[]> {
    const supabase = await createClient();
    
    // Single query to get users with relationship status
    const { data, error } = await supabase.rpc('search_users_with_relationship_status', {
      current_user_id: currentUserId,
      search_term: searchTerm
    });
    
    if (error) {
      console.error("Error searching users:", error);
      // Fallback to original method if RPC fails
      return await this.searchUsersWithStatusFallback(currentUserId, searchTerm);
    }
    
    return data || [];
  },
  
  /**
   * Fallback method using multiple queries (current implementation)
   */
  async searchUsersWithStatusFallback(
    currentUserId: string, 
    searchTerm: string
  ): Promise<UserProfile[]> {
    const supabase = await createClient();
    
    // Get users matching search term
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, gender")
      .ilike("username", `%${searchTerm}%`)
      .neq("id", currentUserId);
    
    if (error || !users?.length) {
      return [];
    }
    
    // Get all relationship statuses in parallel
    const userIds = users.map(user => user.id);
    
    const [friendships, sentRequests, receivedRequests] = await Promise.all([
      supabase
        .from("friends")
        .select("user_id1, user_id2")
        .or(`user_id1.in.(${userIds.join(',')}),user_id2.in.(${userIds.join(',')})`),
      supabase
        .from("friend_requests")
        .select("receiver_id")
        .eq("sender_id", currentUserId)
        .eq("status", "pending")
        .in("receiver_id", userIds),
      supabase
        .from("friend_requests")
        .select("sender_id")
        .eq("receiver_id", currentUserId)
        .eq("status", "pending")
        .in("sender_id", userIds)
    ]);
    
    // Map relationship statuses
    const friendsSet = new Set(
      friendships.data?.map(f => 
        f.user_id1 === currentUserId ? f.user_id2 : f.user_id1
      ) || []
    );
    
    const sentRequestsSet = new Set(
      sentRequests.data?.map(r => r.receiver_id) || []
    );
    
    const receivedRequestsSet = new Set(
      receivedRequests.data?.map(r => r.sender_id) || []
    );
    
    return users.map(user => ({
      ...user,
      relationshipStatus: friendsSet.has(user.id) ? 'friends' as const
        : sentRequestsSet.has(user.id) ? 'request_sent' as const
        : receivedRequestsSet.has(user.id) ? 'request_received' as const
        : 'none' as const
    }));
  },
  
  /**
   * Get pending friend requests with user profiles
   */
  async getPendingRequestsWithProfiles(userId: string): Promise<UserProfile[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("friend_requests")
      .select(`
        sender_id,
        profiles!friend_requests_sender_id_fkey (
          id,
          username,
          avatar_url,
          gender
        )
      `)
      .eq("receiver_id", userId)
      .eq("status", "pending");
    
    if (error) {
      console.error("Error fetching pending requests:", error);
      return [];
    }
    
    return data?.map(request => request.profiles as unknown as UserProfile) || [];
  },
  
  /**
   * Get friends list with profiles (fallback to original implementation)
   */
  async getFriendsWithProfiles(userId: string): Promise<UserProfile[]> {
    const supabase = await createClient();
    
    // Get friend relationships
    const { data: friendships, error } = await supabase
      .from("friends")
      .select("user_id1, user_id2")
      .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);
    
    if (error) {
      console.error("Error fetching friends:", error);
      return [];
    }
    
    if (!friendships?.length) {
      return [];
    }
    
    // Get friend IDs
    const friendIds = friendships.map(row => 
      row.user_id1 === userId ? row.user_id2 : row.user_id1
    );
    
    // Get friend profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, gender")
      .in("id", friendIds);
    
    if (profileError) {
      console.error("Error fetching friend profiles:", profileError);
      return [];
    }
    
    return profiles || [];
  }
};
