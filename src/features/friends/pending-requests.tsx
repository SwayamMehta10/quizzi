import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useFriendActions } from "./use-friend-actions";

interface UserProfile {
	id: string;
	username: string;
	avatar_url: string;
	gender: string;
}

function PendingRequests({ userId }: { userId: string }) {
	const supabase = createClient();
	const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	
	const { handleFriendAction, sendingRequests } = useFriendActions(userId);

	const removePendingRequest = (requestUserId: string) => {
		setPendingRequests(prev => prev.filter(user => user.id !== requestUserId));
	};

	useEffect(() => {
		const getPendingRequests = async () => {
			setIsLoading(true);

			const { data: senders } = await supabase
				.from("friend_requests")
				.select("sender_id")
				.eq("receiver_id", userId)
				.eq("status", "pending");

			if (senders && senders.length > 0) {
				const senderIds = senders.map((request) => request.sender_id);

				const { data: users } = await supabase
					.from("profiles")
					.select("id, username, avatar_url, gender")
					.in("id", senderIds);

				if (users && users.length > 0) {
					setPendingRequests(users);
				}
			}
			setIsLoading(false);
		}

		getPendingRequests();

	}, [supabase, userId]);

  return (
	<div className="max-h-96 overflow-y-auto rounded-lg border bg-background shadow-inner">
		{isLoading && <p className='p-4 text-center text-muted-foreground'>Loading pending requests...</p>}
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
							className="bg-green-600 hover:bg-green-700"
						>
							<Check className="w-4 h-4" />
						</Button>
						<Button 
							variant="outline" 
							size="sm"
							onClick={() => handleFriendAction(user.id, 'decline', removePendingRequest)}
							disabled={sendingRequests.has(user.id)}
							className="border-red-600 text-red-600 hover:bg-red-50"
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