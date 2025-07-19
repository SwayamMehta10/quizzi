"use client"

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { useFriendActions } from "./use-friend-actions";
import { UserProfile } from "@/types/friends";
import { notify } from "@/lib/notifications";
import { errorHandler } from "@/lib/error-handler";
import { validators } from "@/lib/validators";

function SearchUsers({ userId }: { userId: string }) {
	const [checkingUsername, setCheckingUsername] = useState<boolean>(false);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
	const supabase = createClient();
	
	const { handleFriendAction, sendingRequests } = useFriendActions();

	useEffect(() => {
		setCurrentUser({ id: userId });
	}, [userId]);

	const findUsers = async () => {
		if (!currentUser) {
			return;
		}
		
		const validation = validators.searchTerm(searchTerm);
		if (!validation.isValid) {
			notify.error(validation.message!);
			return;
		}
		
		setCheckingUsername(true);
		setSearchResults([]);
		
		try {
			const { data: users } = await supabase
				.from("profiles")
				.select("id, username, avatar_url, gender")
				.ilike("username", `%${searchTerm}%`)
				.neq("id", currentUser.id);

			if (!users?.length) {
				setSearchResults([]);
				return;
			}

			const usersWithStatus = await Promise.all(
				users.map(async (user) => ({
					...user,
					relationshipStatus: await getUserRelationshipStatus(user.id)
				}))
			);

			setSearchResults(usersWithStatus);
		} catch (error) {
			console.error("Error fetching users:", error);
			errorHandler.generic(error, "searching for users");
		} finally {
			setCheckingUsername(false);
		}
	};

	const getUserRelationshipStatus = async (userId: string): Promise<UserProfile['relationshipStatus']> => {
		if (!currentUser) return 'none';

		// Check if friends already
		const { data: friendship } = await supabase
			.from("friends")
			.select("*")
			.or(`and(user_id1.eq.${currentUser.id},user_id2.eq.${userId}),and(user_id1.eq.${userId},user_id2.eq.${currentUser.id})`)
			.maybeSingle();

		if (friendship) return 'friends';

		// Check pending friend requests
		const { data: request } = await supabase
			.from("friend_requests")
			.select("sender_id")
			.or(`and(sender_id.eq.${currentUser.id}, receiver_id.eq.${userId}), and(sender_id.eq.${userId}, receiver_id.eq.${currentUser.id})`)
			.eq("status", "pending")
			.maybeSingle();

		if (request) {
			return request.sender_id === currentUser.id ? 'request_sent' : 'request_received';
		}

		return 'none';
	};

	const updateUserStatus = (userId: string, status: UserProfile['relationshipStatus']) => {
		setSearchResults(prev =>
			prev.map(user =>
				user.id === userId ? { ...user, relationshipStatus: status } : user
			)
		);
	};

	const renderActionButton = (user: UserProfile) => {
		const isLoading = sendingRequests.has(user.id);
		
		switch (user.relationshipStatus) {
			case 'friends':
				return <Button variant="secondary" disabled>Friends</Button>;
			case 'request_sent':
				return <Button variant="outline" disabled>Request Sent</Button>;
			case 'request_received':
				return (
					<div className="flex gap-2">
						<Button 
							variant="default" 
							size="sm"
							onClick={() => handleFriendAction(user.id, 'accept', (userId) => updateUserStatus(userId, 'friends'))}
							disabled={isLoading}
							className="bg-green-600 hover:bg-green-700"
						>
							<Check className="w-4 h-4" />
						</Button>
						<Button 
							variant="outline" 
							size="sm"
							onClick={() => handleFriendAction(user.id, 'decline', (userId) => updateUserStatus(userId, 'none'))}
							disabled={isLoading}
							className="border-red-600 text-red-600 hover:bg-red-50"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				);
			default:
				return (
					<Button 
						variant="outline" 
						onClick={() => handleFriendAction(user.id, 'send', (userId) => updateUserStatus(userId, 'request_sent'))}
						disabled={isLoading}
						className="cursor-pointer"
					>
						{isLoading ? "Sending..." : "Add Friend"}
					</Button>
				);
		}
	};

	return (
		<>
			<div className="flex items-center gap-2 mb-6">
				<Input 
					placeholder="Search by username" 
					value={searchTerm} 
					onChange={(e) => setSearchTerm(e.target.value)} 
				/>
				<Button onClick={findUsers} disabled={checkingUsername} className="cursor-pointer">
					{checkingUsername ? "Searching..." : "Search"}
				</Button>
			</div>

			<div className="max-h-96 overflow-y-auto rounded-lg border bg-background shadow-inner">
				{searchResults.length > 0 ? (
					<ul className="divide-y divide-muted">
						{searchResults.map((user) => (
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
								{renderActionButton(user)}
							</li>
						))}
					</ul>
				) : (
					!checkingUsername && <p className="p-4 text-center text-muted-foreground">No users found.</p>
				)}
			</div>
		</>
	);
}
export default SearchUsers;