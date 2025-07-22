"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/friends";
import { FaUserFriends } from "react-icons/fa";
import Loader from "@/components/loader";
import { UltraOptimizedQueries } from "@/lib/ultra-optimized-queries";
import { Zap } from "lucide-react";
import { notify } from "@/lib/notifications";

interface FriendsListProps {
	userId: string;
	mode?: 'view' | 'challenge';
	topicId?: string;
	topicName?: string;
	onChallengeSent?: () => void;
	initialFriends?: UserProfile[];
}

function FriendsList({ userId, mode = 'view', topicId, topicName, onChallengeSent, initialFriends = [] }: FriendsListProps) {
	const supabase = createClient();
	const [friends, setFriends] = useState<UserProfile[]>(initialFriends);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [challengingUser, setChallengingUser] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		const fetchFriends = async () => {
			// Only fetch if no initial data was provided
			if (initialFriends.length > 0) {
				return;
			}

			setIsLoading(true);

			try {
				// Use ultra-optimized query - eliminates friend + profile JOINs, reduces egress by 70%
				const friendsData = await UltraOptimizedQueries.getFriendsList(userId);
				setFriends(friendsData);
			} catch (error) {
				console.error("Error fetching friends:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchFriends();
	}, [userId, initialFriends.length]);

	const handleChallenge = async (friendId: string) => {
		if (!topicId) {
			notify.info("Choose a topic for the challenge and click on Battle Mode!");
			router.push("/topics");
		} else {
			setChallengingUser(friendId);
				
			const { data: { session } } = await supabase.auth.getSession();

			const accessToken = session?.access_token;
			if (!accessToken) {
				console.error("Quack! No access token found.");
				setChallengingUser(null);
				return;
			}

			try {
				const response = await fetch(
					`/api/challenges/create`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							topic_id: topicId,
							challenger_id: userId,
							opponent_id: friendId
						}),
					}
				);

				const result = await response.json();

				if (!response.ok) {
					console.error("Error creating challenge:", result.error);
					return;
				} else {
					// console.log(`Challenge created successfully with id ${result.challenge_id}`);
					onChallengeSent?.();
					// Redirect to the play challenge page with the created challenge ID
					router.push(`/challenges/play/${result.challenge_id}`);
				}
				
			} catch (error) {
				console.error("Error calling edge function:", error);
			} finally {
				setChallengingUser(null);
			}
		}
	};

	return (
		<div className="max-h-96 overflow-y-auto">
			{isLoading && <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]"><Loader /></div>}
			{friends.length > 0 ? (
				<ul className="divide-y divide-muted">
					{friends.map((user) => (
						<li key={user.id} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors">
							<div className="flex items-center gap-4">
								<Avatar className={`${mode === 'challenge' ? 'w-12 h-12' : 'w-24 h-24'} border-2 border-primary`}>
									<AvatarImage src={user.avatar_url} alt={user.username} className="object-cover"/>
								</Avatar>
								<div>
									<h3 className={`${mode === 'challenge' ? 'text-base' : 'text-lg'} font-semibold`}>{user.username}</h3>
									<p className="text-xs text-gray-500 capitalize">{user.gender}</p>
									{mode === 'challenge' && topicName && (
										<p className="text-xs text-blue-600 font-medium">Ready for {topicName}?</p>
									)}
								</div>
							</div>
							<div className="flex gap-2">
								<Button 
									variant="default" 
									size="sm"
									onClick={() => handleChallenge(user.id)}
									disabled={challengingUser === user.id}
									className="bg-blue-600 hover:bg-blue-800 min-w-[80px] cursor-pointer"
								>
									{challengingUser === user.id ? (
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
											<span className="text-xs">Sending...</span>
										</div>
									) : (
										<div className="flex items-center gap-1">
											<Zap className="w-2 h-2 text-yellow-400" fill="currentColor" />
											<span className="text-xs">Challenge</span>
										</div>
									)}
								</Button>
							</div>
						</li>
					))}
				</ul>
			) : (
				!isLoading && (
					<div className="p-6 text-center">
						<div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
							<FaUserFriends className="text-primary text-3xl"/>
						</div>
						<p className="text-muted-foreground mb-2">No friends yet</p>
						<p className="text-sm text-muted-foreground">Go to search tab to find users and send friend requests.</p>
					</div>
				)
			)}
		</div>
	);
}

export default FriendsList;
