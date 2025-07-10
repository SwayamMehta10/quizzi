// Shared types for the friends feature
export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  gender: string;
  relationshipStatus?: 'none' | 'request_sent' | 'request_received' | 'friends';
}

export interface FriendshipData {
  id: string;
  user_id1: string;
  user_id2: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string | null;
}
