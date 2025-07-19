"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FaUserFriends } from "react-icons/fa";
import { FaUsersViewfinder } from "react-icons/fa6";
import { MdPending } from "react-icons/md";
import SearchUsers from "@/features/friends/search-users";
import PendingRequests from "@/features/friends/pending-requests";
import FriendsList from "@/features/friends/friends-list";
import { UserProfile } from "@/types/friends";
import Loader from "@/components/loader";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { OptimizedQueries } from "@/lib/optimized-queries";

export default function FriendsPage() {
	const [loading, setLoading] = useState(false); // Start with false since we have userLoading
	const [userLoading, setUserLoading] = useState(true);
	const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
	const [friends, setFriends] = useState<UserProfile[]>([]);
	const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();
	const supabase = createClient();

	useEffect(() => {
		const getUser = async () => {
			try {
				const { data: { user }, error } = await supabase.auth.getUser();
				if (error) {
					setUser(null);
				} else {
					setUser(user);
				}
			} catch (error) {
				console.error('Friends page: Error in getUser:', error);
				setUser(null);
			} finally {
				setUserLoading(false);
			}
		};
		getUser();
	}, [supabase]);

	useEffect(() => {
		const fetchData = async () => {
			// Don't redirect if we're still loading the user
			if (userLoading) {
				return;
			}
			if (!user) {
				router.push("/");
				return;
			}
			setLoading(true);
			try {
				// Use optimized queries with caching
				const [friendsData, pendingRequestsData] = await Promise.all([
					OptimizedQueries.getFriendsOptimized(user.id),
					OptimizedQueries.getPendingRequestsOptimized(user.id)
				]);

				setFriends(friendsData as UserProfile[]);
				setPendingRequests(pendingRequestsData as UserProfile[]);
				setPendingRequestsCount((pendingRequestsData as UserProfile[])?.length || 0);
			} catch (error) {
				console.error('Friends page: Error fetching friends data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user, userLoading, router]);

	if (loading || userLoading) {
		return (
			<div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        		<Loader />
      		</div>
		);
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
