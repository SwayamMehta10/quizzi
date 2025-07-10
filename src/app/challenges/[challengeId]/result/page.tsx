import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

interface ChallengeResultsPageProps {
  params: Promise<{ challengeId: string }>;
}

export default async function ChallengeResults({ params }: ChallengeResultsPageProps) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/');
  }
  const { challengeId } = await params;

  // Fetch challenge details
  const { data: challenge, error: challengeError } = await supabase
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
    .eq("challenge_id", challengeId)
    .single();

  if (challengeError || !challenge) {
    notFound();
  }

  // Verify user is part of this challenge
  if (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id) {
    redirect('/challenges');
  }

  // Check if challenge is completed
  if (challenge.status !== 'completed') {
    redirect(`/challenges/${challengeId}/play`);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Challenge Results</h1>
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Challenge Details</h2>
        <p><strong>Topic:</strong> {challenge.topic?.name}</p>
        <p><strong>Challenger:</strong> {challenge.challenger?.username}</p>
        <p><strong>Opponent:</strong> {challenge.opponent?.username}</p>
        <p><strong>Status:</strong> {challenge.status}</p>
        
        {challenge.challenger_score !== null && challenge.opponent_score !== null && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Final Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-medium">{challenge.challenger?.username}</p>
                <p className="text-2xl font-bold">{challenge.challenger_score}</p>
              </div>
              <div className="text-center">
                <p className="font-medium">{challenge.opponent?.username}</p>
                <p className="text-2xl font-bold">{challenge.opponent_score}</p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              {challenge.challenger_score > challenge.opponent_score ? (
                <p className="text-lg font-semibold text-green-600">
                  🎉 {challenge.challenger?.username} Wins!
                </p>
              ) : challenge.opponent_score > challenge.challenger_score ? (
                <p className="text-lg font-semibold text-green-600">
                  🎉 {challenge.opponent?.username} Wins!
                </p>
              ) : (
                <p className="text-lg font-semibold text-blue-600">
                  🤝 It&apos;s a Tie!
                </p>
              )}
            </div>
          </div>
        )}
        
        <p className="mt-4 text-muted-foreground">
          Detailed results and statistics will be shown here. Challenge ID: {challengeId}
        </p>
      </div>
    </div>
  );
}