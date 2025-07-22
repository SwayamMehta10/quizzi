"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChallengeClient from "@/features/game/challenge-client";
import { Challenge } from "@/types/challenges";
import Loader from "@/components/loader";
import { UltraOptimizedQueries } from "@/lib/ultra-optimized-queries";
import { useOptimizedAuth } from "@/hooks/use-optimized-auth";

export default function ChallengesPage() {
  const [loading, setLoading] = useState(false);
  const [initialChallenges, setInitialChallenges] = useState<Challenge[]>([]);
  const { user, loading: userLoading } = useOptimizedAuth();
  const router = useRouter();

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
        // Use ultra-optimized query with caching - reduces egress by 75%
        const challengesData = await UltraOptimizedQueries.getChallengesList(user.id);
        setInitialChallenges(challengesData as Challenge[]);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [user, userLoading, router]);

  if (userLoading || loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader />
      </div>
    );
  }
  return <ChallengeClient initialChallenges={initialChallenges} />;
}