import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

interface PlayChallengePageProps {
  params: Promise<{ challengeId: string }>;
}

export default async function PlayChallenge({ params }: PlayChallengePageProps) {
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

  // Check if challenge is in correct state for playing
  if (challenge.status !== 'pending') {
    redirect(`/challenges/${challengeId}/result`);
  }

  // If user is challenger and challenge is still pending, they can't play yet
  if (challenge.challenger_id === user.id && challenge.status === 'pending') {
    redirect('/challenges');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Play Challenge</h1>
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Challenge Details</h2>
        <p><strong>Topic:</strong> {challenge.topic?.name}</p>
        <p><strong>Challenger:</strong> {challenge.challenger?.username}</p>
        <p><strong>Opponent:</strong> {challenge.opponent?.username}</p>
        <p><strong>Status:</strong> {challenge.status}</p>
        <p className="mt-4 text-muted-foreground">
          Game interface will be implemented here. Challenge ID: {challengeId}
        </p>
      </div>
    </div>
  );
}