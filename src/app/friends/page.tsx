"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { FaUserFriends } from "react-icons/fa";
import { FaUsersViewfinder } from "react-icons/fa6";
import { MdPending } from "react-icons/md";
import SearchUsers from "@/features/friends/search-users";
import PendingRequests from "@/features/friends/pending-requests";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import FriendsList from "@/features/friends/friends-list";

export default function Friends() {
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
		const fetchCurrentUser = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				setCurrentUser({ id: user.id });
			} else {
				window.location.href = "/";
			}
		};

		fetchCurrentUser();
	}, [supabase]);

  useEffect(() => {
    const getPendingRequests = async () => {
      if (!currentUser?.id) return;
      
      const { count, error } = await supabase
        .from("friend_requests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", currentUser.id)
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching pending requests:", error);
      } else {
        setPendingRequests(count || 0);
      } 
    };

    getPendingRequests();
  }, [currentUser?.id, supabase]);

  return (
    <div className="container py-12 md:py-8">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Friends</h1>
      <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-6 bg-background border">
            <TabsTrigger value="find" className="data-[state=active]:bg-primary data-[state=active]:text-white"><FaUsersViewfinder className="text-primary"/>Find</TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-white"><MdPending className="text-primary"/>
              Requests
              <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums" variant="destructive">
                {pendingRequests}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="friends" className="data-[state=active]:bg-primary data-[state=active]:text-white"><FaUserFriends className="text-primary"/>Friends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="find">
            {currentUser?.id && <SearchUsers userId={currentUser.id} />}
          </TabsContent>

          <TabsContent value="requests">
            {currentUser?.id && <PendingRequests userId={currentUser.id} />}
          </TabsContent>

          <TabsContent value="friends">
            {currentUser?.id && <FriendsList userId={currentUser.id} />}
          </TabsContent>
	  </Tabs>
	</div>
  );
}