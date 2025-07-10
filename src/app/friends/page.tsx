"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FaUserFriends } from "react-icons/fa";
import { FaUsersViewfinder } from "react-icons/fa6";
import { MdPending } from "react-icons/md";
import { createClient } from "@/utils/supabase/client";
import SearchUsers from "@/features/friends/search-users";
import PendingRequests from "@/features/friends/pending-requests";
import FriendsList from "@/features/friends/friends-list";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/friends";

export default function FriendsPage() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
	const [friends, setFriends] = useState<UserProfile[]>([]);
	const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		const checkAuthAndFetchData = async () => {
			const { data: { user }, error } = await supabase.auth.getUser();
			if (error || !user) {
				router.push("/");
				return;
			}
			setUser(user);
      console.log("User authenticated:", user);
      console.log("Fetching friends and requests...");

			// Fetch pending requests count
			const { count } = await supabase
				.from("friend_requests")
				.select("*", { count: "exact", head: true })
				.eq("receiver_id", user.id)
				.eq("status", "pending");

			setPendingRequestsCount(count || 0);

			// Fetch friends
			const { data: friendsData } = await supabase
				.from("friends")
				.select("user_id1, user_id2")
				.or(`user_id1.eq.${user.id}, user_id2.eq.${user.id}`);

			const friendIds =
				friendsData?.map((row) =>
					row.user_id1 === user.id ? row.user_id2 : row.user_id1
				) || [];

			if (friendIds.length > 0) {
				const { data: friendsProfiles } = await supabase
					.from("profiles")
					.select("id, username, avatar_url, gender")
					.in("id", friendIds);

				setFriends(friendsProfiles || []);
			}

			// Fetch pending requests
			const { data: pendingRequestsData } = await supabase
				.from("friend_requests")
				.select("sender_id")
				.eq("receiver_id", user.id)
				.eq("status", "pending");

			const senderIds =
				pendingRequestsData?.map((req) => req.sender_id) || [];

			if (senderIds.length > 0) {
				const { data: pendingRequestsProfiles } = await supabase
					.from("profiles")
					.select("id, username, avatar_url, gender")
					.in("id", senderIds);

				setPendingRequests(pendingRequestsProfiles || []);
			}

			setLoading(false);
		};

		checkAuthAndFetchData();
	}, [supabase, router]);

	if (loading) {
		return <div className="container py-12 md:py-8">Loading...</div>;
	}

	return (
		<div className="container py-12 md:py-8">
			<h1 className="text-3xl font-extrabold tracking-tight mb-6">
				Friends
			</h1>
			{user && (
				<Tabs defaultValue="search" className="w-full">
					<TabsList className="grid w-full md:w-auto grid-cols-3 mb-6 bg-background border">
						<TabsTrigger
							value="search"
							className="data-[state=active]:bg-primary data-[state=active]:text-white"
						>
							<FaUsersViewfinder className="text-primary" />
							Search
						</TabsTrigger>
						<TabsTrigger
							value="requests"
							className="data-[state=active]:bg-primary data-[state=active]:text-white"
						>
							<MdPending className="text-primary" />
							Requests
							<Badge
								className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
								variant="destructive"
							>
								{pendingRequestsCount}
							</Badge>
						</TabsTrigger>
						<TabsTrigger
							value="friends"
							className="data-[state=active]:bg-primary data-[state=active]:text-white"
						>
							<FaUserFriends className="text-primary" />
							Friends
						</TabsTrigger>
					</TabsList>

					<TabsContent value="search">
						<SearchUsers userId={user.id} />
					</TabsContent>

					<TabsContent value="requests">
						<PendingRequests
							userId={user.id}
							initialPendingRequests={pendingRequests}
						/>
					</TabsContent>

					<TabsContent value="friends">
						<FriendsList
							userId={user.id}
							initialFriends={friends}
						/>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
