"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ChallengeClient from "@/features/game/challenge-client";
import { User } from "@supabase/supabase-js";

import { Challenge } from "@/types/challenges";

export default function ChallengesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialChallenges, setInitialChallenges] = useState<Challenge[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndFetchChallenges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);

      // Fetch initial challenges data
      const { data: challengesData } = await supabase
        .from("challenges")
        .select(`
          *,
          challenger:challenger_id (
            id, username, avatar_url, gender
          ),
          opponent:opponent_id (
            id, username, avatar_url, gender
          ),
          topic:topic_id (
            topic_id, name
          )
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`);

      setInitialChallenges(challengesData || []);
      setLoading(false);
    };

    checkAuthAndFetchChallenges();
  }, [supabase, router]);

  if (loading) {
    return <div className="container py-12 md:py-8">Loading...</div>;
  }

  if (!user) {
    return <div className="container py-12 md:py-8">Please log in to access this page.</div>;
  }

  return <ChallengeClient initialChallenges={initialChallenges} />;
}