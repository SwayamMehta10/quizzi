"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChallengeClient from "@/features/game/challenge-client";
import { Challenge } from "@/types/challenges";
import Loader from "@/components/loader";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { OptimizedQueries } from "@/lib/optimized-queries";

export default function ChallengesPage() {
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [initialChallenges, setInitialChallenges] = useState<Challenge[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchChallenges = async () => {
      // Don't redirect if we're still loading the user
      if (userLoading) {
        return;
      }
      
      if (!user) {
        router.push('/');
        return;
      }

      setLoading(true);
      try {
        // Use optimized query with caching
        const challengesData = await OptimizedQueries.getChallengesOptimized(user.id);
        setInitialChallenges(challengesData as Challenge[]);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [user, userLoading, router]);

  if (userLoading || (!user && !userLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader />
      </div>
    );
  } else if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader />
      </div>
    );
  } else {
    return <ChallengeClient initialChallenges={initialChallenges} />;
  }
}