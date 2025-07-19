"use client";

import { useState } from "react";
import { errorHandler } from "@/lib/error-handler";

export const useFriendActions = () => {
	const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

	const handleFriendAction = async (
		userId: string, 
		action: 'send' | 'accept' | 'decline',
		onSuccess?: (userId: string) => void
	) => {
		setSendingRequests(prev => new Set(prev).add(userId));

		try {
			const response = await fetch('/api/friends', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action,
					targetUserId: userId
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to perform action');
			}

			onSuccess?.(userId);
		} catch (error) {
			errorHandler.generic(error, `Error ${action}ing friend request:`);
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
