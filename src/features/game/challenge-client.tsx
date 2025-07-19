"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Challenge } from "@/types/challenges";
import { errorHandler } from "@/lib/error-handler";
import { useRouter } from "next/navigation";
import Loader from "@/components/loader";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { OptimizedQueries } from "@/lib/optimized-queries";

interface ChallengeClientProps {
  initialChallenges: Challenge[];
}

export default function ChallengeClient({ initialChallenges }: ChallengeClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isFetchingChallenges, setIsFetchingChallenges] = useState<boolean>(false);
  const supabase = createClient();

  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user?.id) return;

      // Only fetch if no initial data was provided
      if (initialChallenges.length > 0) {
        return;
      }

      try {
        setIsFetchingChallenges(true);
        
        // Use optimized query instead of the heavy JOIN query
        const data = await OptimizedQueries.getChallengesOptimized(user.id);
        setChallenges(data as Challenge[]);
      } catch (error) {
        errorHandler.generic(error, "Error fetching challenges:");
      } finally {
        setIsFetchingChallenges(false);
      }
    }

    fetchChallenges();
  }, [user?.id, initialChallenges.length]);

  const handleChallengeAction = (challengeId: string, action: 'play' | 'view-results') => {
    console.log(`Action: ${action}, Challenge ID: ${challengeId}`);
    if (action === 'play') {
      router.push(`/challenges/play/${challengeId}`);
    } else {
      router.push(`/challenges/results/${challengeId}`);
    }
  };

  const getStatusBadge = (challenger_status: string, opponent_status: string) => {
    if (challenger_status === 'pending' || opponent_status === 'pending') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
    }
  };

  const renderActionButton = (challenge: Challenge) => {
    if ((challenge.challenger_status === 'pending' && challenge.challenger_id == user?.id) || (challenge.opponent_status === 'pending' && challenge.opponent_id == user?.id)) {
      return (
          <Button 
            onClick={() => handleChallengeAction(challenge.challenge_id, 'play')}
            className="bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer"
          >
            Play
          </Button>
      )
    } else if ((challenge.opponent_status === 'pending' && challenge.challenger_id == user?.id) || (challenge.challenger_status === 'pending' && challenge.opponent_id == user?.id)) {
      return (
          <Button disabled className="bg-gray-100 text-gray-600 cursor-not-allowed">
            Waiting for opponent
          </Button>
        );
    } else {
      return (
        <Button 
          onClick={() => handleChallengeAction(challenge.challenge_id, 'view-results')}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-white cursor-pointer"
        >
          View Results
        </Button>
      );
    }
  };

  // Don't render if still loading
  if (isFetchingChallenges) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-8">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">Your Challenges</h1>
      {challenges.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg">No challenges found.</p>
            <p className="text-sm text-gray-400 mt-2">Challenge your friends to start playing!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <Card key={challenge.challenge_id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-primary">
                    {challenge.topic.name}
                  </CardTitle>
                  {getStatusBadge(challenge.challenger_status, challenge.opponent_status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Players Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage src={challenge.challenger.avatar_url} alt={challenge.challenger.username} className="object-cover"/>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{challenge.challenger.username}</p>
                        <p className="text-gray-500 capitalize">{challenge.challenger.gender}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 font-medium">VS</div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-right">
                        <p className="font-medium">{challenge.opponent.username}</p>
                        <p className="text-gray-500 capitalize">{challenge.opponent.gender}</p>
                      </div>
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage src={challenge.opponent.avatar_url} alt={challenge.opponent.username} className="object-cover"/>
                      </Avatar>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="text-xs text-gray-500 text-center">
                    {new Date(challenge.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex justify-center pt-2">
                    {renderActionButton(challenge)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
