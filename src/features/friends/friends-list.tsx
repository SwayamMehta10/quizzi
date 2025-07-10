"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/friends";
import { FaUserFriends } from "react-icons/fa";


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

	useEffect(() => {
		const fetchFriends = async () => {
			// Only fetch if no initial data was provided
			if (initialFriends.length > 0) {
				return;
			}

			setIsLoading(true);

			const { data, error } = await supabase
				.from("friends")
				.select("user_id1, user_id2")
				.or(`user_id1.eq.${userId}, user_id2.eq.${userId}`);

			if (error) {
				console.error("Error fetching friends:", error);
			} else {
				const friendIds = data?.map(row => 
					row.user_id1 === userId ? row.user_id2 : row.user_id1
				) ?? [];

				if (friendIds.length > 0) {
					const { data, error} = await supabase
						.from("profiles")
						.select("id, username, avatar_url, gender")
						.in("id", friendIds);

					if (error) {
						console.error("Error fetching friend profiles:", error);
					} else {
						setFriends(data);
					}
				}
			}

			setIsLoading(false);
		};

		fetchFriends();
	}, [userId, supabase, initialFriends.length]);

	const handleChallenge = async (friendId: string) => {
		if (!topicId) return;
		
		setChallengingUser(friendId);
				
		const { data: { session } } = await supabase.auth.getSession();

		const accessToken = session?.access_token;
		if (!accessToken) {
			console.error("Quack! No access token found.");
			setChallengingUser(null);
			return;
		}

		// Debug logging
		// console.log("Challenge payload:", {
		// 	topic_id: topicId,
		// 	challenger_id: userId,
		// 	opponent_id: friendId
		// });
		// console.log("Session user:", session?.user?.id);

		try {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_challenge_with_questions`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${accessToken}`
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
				console.log(`Challenge created successfully with id ${result.challenge_id}`);
				onChallengeSent?.();
			}
			
		} catch (error) {
			console.error("Error calling edge function:", error);
		} finally {
			setChallengingUser(null);
		}
	};

	return (
		<div className="max-h-96 overflow-y-auto rounded-lg border bg-background shadow-inner">
			{isLoading && <p className='p-4 text-center text-muted-foreground'>Loading friends list...</p>}
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
											<span>⚡</span>
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
