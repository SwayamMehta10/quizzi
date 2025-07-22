"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useFriendActions } from "./use-friend-actions";
import { UserProfile } from "@/types/friends";
import { OptimizedQueries } from "@/lib/optimized-queries";
import Loader from "@/components/loader";

interface PendingRequestsProps {
  userId: string;
  initialPendingRequests?: UserProfile[];
}

function PendingRequests({ userId, initialPendingRequests = [] }: PendingRequestsProps) {
	const supabase = createClient();
	const [pendingRequests, setPendingRequests] = useState<UserProfile[]>(initialPendingRequests);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { handleFriendAction, sendingRequests } = useFriendActions();

	const removePendingRequest = (requestUserId: string) => {
		setPendingRequests(prev => prev.filter(user => user.id !== requestUserId));
	};

	useEffect(() => {
		const getPendingRequests = async () => {
			// Only fetch if no initial data was provided
			if (initialPendingRequests.length > 0) {
				return;
			}

			setIsLoading(true);

			try {
				// Use optimized query
				const requestsData = await OptimizedQueries.getPendingRequestsOptimized(userId);
				setPendingRequests(requestsData);
			} catch (error) {
				console.error("Error fetching pending requests:", error);
			} finally {
				setIsLoading(false);
			}
		}

		getPendingRequests();

	}, [supabase, userId, initialPendingRequests.length]);

  return (
	<div className="max-h-96 overflow-y-auto rounded-lg border bg-background shadow-inner">
		{isLoading && <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]"><Loader /></div>}
		{pendingRequests.length > 0 ? (
			<ul className="divide-y divide-muted">
				{pendingRequests.map((user) => (
					<li key={user.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors">
						<div className="flex items-center gap-4">
							<Avatar className="w-24 h-24 border-2 border-primary">
								<AvatarImage src={user.avatar_url} alt={user.username} className="object-cover"/>
							</Avatar>
							<div>
								<h3 className="text-lg font-semibold">{user.username}</h3>
								<p className="text-xs text-gray-500 capitalize">{user.gender}</p>
							</div>
						</div>
						<div className="flex gap-2">
						<Button 
							variant="default" 
							size="sm"
							onClick={() => handleFriendAction(user.id, 'accept', removePendingRequest)}
							disabled={sendingRequests.has(user.id)}
							className="bg-green-600 hover:bg-green-700 cursor-pointer"
						>
							<Check className="w-4 h-4" />
						</Button>
						<Button 
							variant="outline" 
							size="sm"
							onClick={() => handleFriendAction(user.id, 'decline', removePendingRequest)}
							disabled={sendingRequests.has(user.id)}
							className="border-red-600 text-red-600 hover:bg-red-50 cursor-pointer"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
					</li>
				))}
			</ul>
		) : (
			!isLoading && <p className="p-4 text-center text-muted-foreground">No pending requests.</p>
		)}
	</div>
  )
}
export default PendingRequests;