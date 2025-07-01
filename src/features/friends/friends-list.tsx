import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserProfile {
	id: string;
	username: string;
	avatar_url: string;
	gender: string;
}

function FriendsList({ userId }: { userId: string }) {
	const supabase = createClient();
	const [friends, setFriends] = useState<UserProfile[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	useEffect(() => {
		const fetchFriends = async () => {
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
	}, [userId, supabase]);

	return (
		<div className="max-h-96 overflow-y-auto rounded-lg border bg-background shadow-inner">
			{isLoading && <p className='p-4 text-center text-muted-foreground'>Loading friends list...</p>}
			{friends.length > 0 ? (
				<ul className="divide-y divide-muted">
					{friends.map((user) => (
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
								onClick={() => {}} // Placeholder for challeng action
								className="bg-green-600 hover:bg-green-700"
							>
								Challenge
							</Button>
						</div>
						</li>
					))}
				</ul>
			) : (
				!isLoading && <p className="p-4 text-center text-muted-foreground">Go to search tab to find users and send friend requests.</p>
			)}
		</div>
	);
}
export default FriendsList;
