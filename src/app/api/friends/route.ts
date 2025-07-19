import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface FriendActionRequest {
  action: 'send' | 'accept' | 'decline';
  targetUserId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetUserId }: FriendActionRequest = await request.json();

    if (!action || !targetUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot perform action on yourself' }, { status: 400 });
    }

    switch (action) {
      case 'send':
        // Check if request already exists
        const { data: existingRequest } = await supabase
          .from("friend_requests")
          .select("id")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
          .single();

        if (existingRequest) {
          return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
        }

        // Check if already friends
        const [userId1, userId2] = [user.id, targetUserId].sort();
        const { data: existingFriendship } = await supabase
          .from("friends")
          .select("id")
          .eq("user_id1", userId1)
          .eq("user_id2", userId2)
          .single();

        if (existingFriendship) {
          return NextResponse.json({ error: 'Already friends' }, { status: 400 });
        }

        const { error: sendError } = await supabase
          .from("friend_requests")
          .insert({
            sender_id: user.id,
            receiver_id: targetUserId,
            status: "pending"
          });

        if (sendError) {
          console.error('Error sending friend request:', sendError);
          return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Friend request sent' });

      case 'accept':
        // Use database transaction for consistency
        const { error: transactionError } = await supabase.rpc('accept_friend_request', {
          p_sender_id: targetUserId,
          p_receiver_id: user.id
        });

        if (transactionError) {
          // Fallback to manual transaction
          const { error: updateError } = await supabase
            .from("friend_requests")
            .update({ status: "accepted" })
            .eq("sender_id", targetUserId)
            .eq("receiver_id", user.id);

          if (updateError) {
            console.error('Error accepting friend request:', updateError);
            return NextResponse.json({ error: 'Failed to accept friend request' }, { status: 500 });
          }

          // Create friendship record with consistent ordering
          const [user1, user2] = [user.id, targetUserId].sort();
          const { error: friendshipError } = await supabase
            .from("friends")
            .insert({ user_id1: user1, user_id2: user2 });

          if (friendshipError) {
            // Rollback on failure
            await supabase
              .from("friend_requests")
              .update({ status: "pending" })
              .eq("sender_id", targetUserId)
              .eq("receiver_id", user.id);
            
            console.error('Error creating friendship:', friendshipError);
            return NextResponse.json({ error: 'Failed to create friendship' }, { status: 500 });
          }
        }

        return NextResponse.json({ success: true, message: 'Friend request accepted' });

      case 'decline':
        const { error: declineError } = await supabase
          .from("friend_requests")
          .update({ status: "rejected" })
          .eq("sender_id", targetUserId)
          .eq("receiver_id", user.id);

        if (declineError) {
          console.error('Error declining friend request:', declineError);
          return NextResponse.json({ error: 'Failed to decline friend request' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Friend request declined' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get friend requests and friends list
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'friends' | 'pending' | 'sent'

    switch (type) {
      case 'friends':
        // Get friends with optimized query
        const { data: friendships, error: friendsError } = await supabase
          .from("friends")
          .select(`
            user_id1,
            user_id2,
            user1:user_id1 (id, username, avatar_url, gender),
            user2:user_id2 (id, username, avatar_url, gender)
          `)
          .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

        if (friendsError) {
          return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
        }

        const friends = friendships?.map(friendship => {
          return friendship.user_id1 === user.id ? friendship.user2 : friendship.user1;
        }) || [];

        return NextResponse.json({ friends });

      case 'pending':
        // Get pending requests received
        const { data: pendingRequests, error: pendingError } = await supabase
          .from("friend_requests")
          .select(`
            id,
            sender_id,
            created_at,
            sender:sender_id (id, username, avatar_url, gender)
          `)
          .eq("receiver_id", user.id)
          .eq("status", "pending");

        if (pendingError) {
          return NextResponse.json({ error: 'Failed to fetch pending requests' }, { status: 500 });
        }

        return NextResponse.json({ pendingRequests: pendingRequests || [] });

      case 'sent':
        // Get sent requests
        const { data: sentRequests, error: sentError } = await supabase
          .from("friend_requests")
          .select(`
            id,
            receiver_id,
            status,
            created_at,
            receiver:receiver_id (id, username, avatar_url, gender)
          `)
          .eq("sender_id", user.id);

        if (sentError) {
          return NextResponse.json({ error: 'Failed to fetch sent requests' }, { status: 500 });
        }

        return NextResponse.json({ sentRequests: sentRequests || [] });

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
