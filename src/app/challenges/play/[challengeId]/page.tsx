import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ChallengePageProps, Challenge } from "@/types/challenges";
import PlayChallengeClient from "@/features/game/play-challenge";
import Link from "next/link";
import { OptimizedQueries } from "@/lib/optimized-queries";

interface Choice {
  choice_id: string;
  text: string;
  is_correct: boolean;
}

export default async function PlayChallengePage({ params }: ChallengePageProps) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/');
  }
  const { challengeId } = await params;

  // Use optimized query for challenge details with server auth context
  const challenge = await OptimizedQueries.getChallengeDetailsOptimized(challengeId, supabase);

  if (!challenge || (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id)) {
    redirect('/challenges');
  }

  // Check if current user has already completed this challenge
  const { data: userResult } = await supabase
    .from("challenge_results")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .single();

  if (userResult) {
    redirect(`/challenges/results/${challengeId}`);
  }

  // Check if both users have completed the challenge
  const { data: allResults } = await supabase
    .from("challenge_results")
    .select("*")
    .eq("challenge_id", challengeId);

  if (allResults && allResults.length >= 2) {
    redirect(`/challenges/results/${challengeId}`);
  }

  // Fetch questions for this challenge
  const { data: challengeQuestions, error: questionsError } = await supabase
    .from("challenge_questions")
    .select(`
      *,
      questions (
        question_id, 
        text,
        choices (
          choice_id,
          text,
          is_correct
        )
      )
    `)
    .eq("challenge_id", challengeId)
    .order("order_index");

  // console.log('Questions fetch result:', { challengeQuestions, questionsError });

  if (questionsError) {
    console.error("Error fetching questions:", questionsError);
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Questions</h1>
          <p className="text-gray-600 mb-4">
            Unable to load questions for this challenge.
          </p>
          <Link 
            href="/challenges"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  // If no challenge questions exist, this means they weren't created when the challenge was made
  if (!challengeQuestions || challengeQuestions.length === 0) {
    console.log('No challenge questions found - they should have been created when challenge was made');
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Challenge Setup Error</h1>
          <p className="text-gray-600 mb-4">
            This challenge wasn&apos;t set up properly. Please try creating a new challenge.
          </p>
          <Link 
            href="/challenges"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  // Transform the fetched questions to the expected format - NEVER send correct answers
  const questions = challengeQuestions?.map(cq => {
    if (!cq.questions) {
      console.warn('Missing question data for challenge question:', cq);
      return null;
    }
    
    // Create paired choices array to maintain choice_id and text relationship
    const pairedChoices = cq.questions.choices?.map((c: Choice) => ({
      id: c.choice_id,
      text: c.text
    })) || [];
    
    // Shuffle the paired choices to prevent correct answer from always being first
    const shuffledChoices = [...pairedChoices].sort(() => 0.5 - Math.random());
    
    return {
      question_id: cq.questions.question_id,
      text: cq.questions.text,
      choices: shuffledChoices.map(c => c.text),
      choice_ids: shuffledChoices.map(c => c.id)
    };
  }).filter(q => q !== null) || [];

  // Debug logging to understand what's happening
  // console.log('challengeQuestions:', challengeQuestions);
  // console.log('transformed questions:', questions);
  // console.log('questions length:', questions.length);

  // If no questions found, redirect back to challenges
  if (questions.length === 0) {
    console.log('No questions found after transformation, redirecting to challenges');
    redirect('/challenges');
  }

  // Transform cached challenge to expected Challenge type
  const transformedChallenge: Challenge = {
    challenge_id: challenge.challenge_id,
    challenger_id: challenge.challenger_id,
    opponent_id: challenge.opponent_id,
    topic_id: challenge.topic_id,
    challenger_status: challenge.challenger_status,
    opponent_status: challenge.opponent_status,
    created_at: challenge.created_at,
    challenger: challenge.challenger || { 
      id: challenge.challenger_id, 
      username: 'Unknown', 
      avatar_url: '', 
      gender: '' 
    },
    opponent: challenge.opponent || { 
      id: challenge.opponent_id, 
      username: 'Unknown', 
      avatar_url: '', 
      gender: '' 
    },
    topic: challenge.topic || { topic_id: challenge.topic_id, name: 'Unknown Topic' }
  };

  return (
    <PlayChallengeClient 
      challenge={transformedChallenge}
      questions={questions}
      currentUser={user}
    />
  );
}