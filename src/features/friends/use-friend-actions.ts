"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { errorHandler } from "@/lib/error-handler";

export const useFriendActions = (currentUserId: string) => {
	const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
	const supabase = createClient();

	const handleFriendAction = async (
		userId: string, 
		action: 'send' | 'accept' | 'decline',
		onSuccess?: (userId: string) => void
	) => {
		setSendingRequests(prev => new Set(prev).add(userId));

		try {
			if (action === 'send') {
				const { error } = await supabase
					.from("friend_requests")
					.insert({
						sender_id: currentUserId,
						receiver_id: userId,
						status: "pending"
					});

				if (error) throw error;

			} else if (action === 'accept') {
				// Accept request and create friendship
				const { error: updateError } = await supabase
					.from("friend_requests")
					.update({ status: "accepted" })
					.eq("sender_id", userId)
					.eq("receiver_id", currentUserId);

				if (updateError) throw updateError;

				// Create friendship record with consistent ordering
				const [user1, user2] = [currentUserId, userId].sort();
				const { error: friendshipError } = await supabase
					.from("friends")
					.insert({ user_id1: user1, user_id2: user2 });

				if (friendshipError) {
					// Rollback on failure
					await supabase
						.from("friend_requests")
						.update({ status: "pending" })
						.eq("sender_id", userId)
						.eq("receiver_id", currentUserId);
					throw friendshipError;
				}

			} else if (action === 'decline') {
				const { error } = await supabase
					.from("friend_requests")
					.update({ status: "rejected" })
					.eq("sender_id", userId)
					.eq("receiver_id", currentUserId);

				if (error) throw error;
			}

			onSuccess?.(userId);
		} catch (error) {
			console.error(`Error ${action}ing friend request:`, error);
			errorHandler.generic(error, `${action} friend request`);
		} finally {
			setSendingRequests(prev => {
				const newSet = new Set(prev);
				newSet.delete(userId);
				return newSet;
			});
		}
	};

	return {
		handleFriendAction,
		sendingRequests
	};
};
