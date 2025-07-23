import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChallengePageProps } from "@/types/challenges";
import ChallengeResults from "@/features/game/challenge-results";
import { CachedQueries } from "@/lib/redis-cache";

interface Answer {
  question_id: string;
  question_text: string;
  user_id: string;
  choice_id: string | null;
  choice_text: string | null;
  is_correct: boolean;
  time_taken: number;
  correct_choice: string;
  question_order: number;
  points_scored?: number;
}

interface PlayerResult {
  user_id: string;
  username: string;
  avatar_url: string;
  total_score: number;
  answers: Answer[];
}

interface ChallengeResultsResponse {
  challenger: PlayerResult;
  opponent: PlayerResult;
  topicName: string;
  challenge: {
    challenger_id: string;
    opponent_id: string;
    challenger: { username: string; avatar_url: string };
    opponent: { username: string; avatar_url: string };
    topic: { name: string };
  };
  winner?: string | null;
  isCurrentUserWinner?: boolean;
  isTie?: boolean;
}

export default async function ChallengeResultsPage({ params }: ChallengePageProps) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/');
  }
  const { challengeId } = await params;

  try {
    // console.log('ChallengeResultsPage: Starting optimized challenge fetch for:', challengeId);
    
    // Use server-side cached query with proper auth context
    const challenge = await CachedQueries.assembleChallengeWithCacheServer(challengeId, supabase);
    if (!challenge) {
      console.error('ChallengeResultsPage: Challenge not found or no access:', challengeId);
      notFound();
    }

    // Verify user access
    if (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id) {
      console.error('ChallengeResultsPage: User does not have access to challenge:', challengeId);
      redirect('/challenges');
    }

    // console.log('ChallengeResultsPage: Successfully got challenge data with server auth');

    // Get completion status - lightweight query
    const { data: allResults } = await supabase
      .from("challenge_results")
      .select("user_id, score")
      .eq("challenge_id", challengeId);

    if (!allResults || allResults.length === 0) {
      notFound();
    }

    // Check if current user has completed the challenge
    const userResult = allResults.find(result => result.user_id === user.id);
    if (!userResult) {
      redirect(`/challenges/play/${challengeId}`);
    }

    // Determine if both players have completed
    const bothPlayersCompleted = allResults.length === 2;
    
    if (!bothPlayersCompleted) {
      // Only one player has completed - show waiting state
      const completedResult = allResults[0];
      return (
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold text-white mb-4">Challenge Completed!</h1>
              <p className="text-gray-400 mb-6">
                Waiting for opponent to complete the challenge...
              </p>
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <p className="text-white">Your Score: <span className="font-bold text-green-400">{completedResult.score}</span></p>
              </div>
              <p className="text-sm text-gray-500">
                Results will be available once your opponent completes the challenge.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Optimized separate queries instead of heavy JOINs
    const [answersResult, questionsResult] = await Promise.all([
      // Lightweight answers query - no JOINs
      supabase
        .from("answers")
        .select("user_id, question_id, choice_id, is_correct, time_taken, points_scored, answered_at")
        .eq("challenge_id", challengeId)
        .order("answered_at"),

      // Simple question order mapping
      supabase
        .from("challenge_questions")
        .select("question_id, order_index")
        .eq("challenge_id", challengeId)
        .order("order_index")
    ]);

    if (answersResult.error || questionsResult.error) {
      console.error("Error fetching data:", answersResult.error || questionsResult.error);
      throw new Error('Failed to fetch challenge data');
    }

    // Get unique question IDs from answers
    const questionIds = [...new Set(answersResult.data?.map(a => a.question_id) || [])];
    const choiceIds = [...new Set(answersResult.data?.map(a => a.choice_id).filter(Boolean) || [])];

    // Lightweight separate queries for questions and choices
    const [questionsData, choicesData] = await Promise.all([
      questionIds.length > 0 ? supabase
        .from("questions")
        .select("question_id, text")
        .in("question_id", questionIds) : { data: [] },
      
      choiceIds.length > 0 ? supabase
        .from("choices")
        .select("choice_id, question_id, text, is_correct")
        .in("choice_id", choiceIds) : { data: [] }
    ]);

    // Create lookup maps for fast access
    const questionsMap = new Map(
      (questionsData.data || []).map(q => [q.question_id, q])
    );
    const choicesMap = new Map(
      (choicesData.data || []).map(c => [c.choice_id, c])
    );

    // Process data using optimized lookups
    const questionOrderMap = new Map(
      questionsResult.data.map(cq => [cq.question_id, cq.order_index])
    );

    const challengerAnswers: Answer[] = [];
    const opponentAnswers: Answer[] = [];

    answersResult.data?.forEach(answer => {
      const questionOrder = questionOrderMap.get(answer.question_id) || 0;
      const question = questionsMap.get(answer.question_id);
      const choice = answer.choice_id ? choicesMap.get(answer.choice_id) : null;
      
      // Get correct choice for this question
      const correctChoice = (choicesData.data || [])
        .find(c => c.question_id === answer.question_id && c.is_correct)?.text || 'N/A';
      
      const processedAnswer: Answer = {
        question_id: answer.question_id,
        question_text: question?.text || 'Unknown Question',
        user_id: answer.user_id,
        choice_id: answer.choice_id,
        choice_text: choice?.text || null,
        is_correct: answer.is_correct,
        time_taken: answer.time_taken || 10,
        correct_choice: correctChoice,
        question_order: questionOrder,
        points_scored: answer.points_scored || 0
      };

      if (answer.user_id === challenge.challenger_id) {
        challengerAnswers.push(processedAnswer);
      } else if (answer.user_id === challenge.opponent_id) {
        opponentAnswers.push(processedAnswer);
      } else {
        console.warn("Answer from unknown user:", answer.user_id);
      }
    });

    // Use stored scores from challenge_results instead of recalculating
    const challengerScore = allResults.find(r => r.user_id === challenge.challenger_id)?.score || 0;
    const opponentScore = allResults.find(r => r.user_id === challenge.opponent_id)?.score || 0;

    const challengerResult: PlayerResult = {
      user_id: challenge.challenger_id,
      username: challenge.challenger?.username || 'Unknown Player',
      avatar_url: challenge.challenger?.avatar_url || '',
      total_score: challengerScore, // Use stored score
      answers: challengerAnswers.sort((a, b) => a.question_order - b.question_order)
    };

    const opponentResult: PlayerResult = {
      user_id: challenge.opponent_id,
      username: challenge.opponent?.username || 'Unknown Player',
      avatar_url: challenge.opponent?.avatar_url || '',
      total_score: opponentScore, // Use stored score
      answers: opponentAnswers.sort((a, b) => a.question_order - b.question_order)
    };

    // Use stored winner_id if available, otherwise calculate and store
    let winner: string | null = challenge.winner_id;
    if (winner === null) {
      // Only calculate if not already stored
      if (challengerScore > opponentScore) {
        winner = challenge.challenger_id;
      } else if (opponentScore > challengerScore) {
        winner = challenge.opponent_id;
      }
      // Store the calculated winner for future visits
      await supabase
        .from('challenges')
        .update({ 
          winner_id: winner,
          completed_at: new Date().toISOString()
        })
        .eq('challenge_id', challengeId);
      
      // Invalidate cache since we updated the challenge
      CachedQueries.invalidateChallenge(challengeId);
    }

    const resultsData: ChallengeResultsResponse = {
      challenger: challengerResult,
      opponent: opponentResult,
      topicName: challenge.topic?.name || 'Unknown Topic',
      challenge: {
        challenger_id: challenge.challenger_id,
        opponent_id: challenge.opponent_id,
        challenger: { 
          username: challenge.challenger?.username || 'Unknown Player', 
          avatar_url: challenge.challenger?.avatar_url || '' 
        },
        opponent: { 
          username: challenge.opponent?.username || 'Unknown Player', 
          avatar_url: challenge.opponent?.avatar_url || '' 
        },
        topic: { 
          name: challenge.topic?.name || 'Unknown Topic' 
        }
      },
      winner: winner,
      isCurrentUserWinner: winner === user.id,
      isTie: winner === null
    };

    // Handle normal results display
    const { challenger, opponent, topicName, winner: resultWinner, isCurrentUserWinner, isTie } = resultsData;

    return (
      <div className="container mx-auto min-h-[calc(100vh-6rem)]">
        <ChallengeResults
          challenger={challenger}
          opponent={opponent}
          topicName={topicName}
          winner={resultWinner}
          isCurrentUserWinner={isCurrentUserWinner}
          isTie={isTie}
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching challenge results:', error);
    
    // Fallback to direct database access if API fails
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("challenger_id, opponent_id, challenger_status, opponent_status")
      .eq("challenge_id", challengeId)
      .single();

    if (challengeError || !challenge) {
      notFound();
    }

    if (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id) {
      redirect('/challenges');
    }

    // Check if both users have completed the challenge
    const { data: allResults } = await supabase
      .from("challenge_results")
      .select("*")
      .eq("challenge_id", challengeId);

    if (!allResults || allResults.length < 2) {
      redirect(`/challenges/play/${challengeId}`);
    }

    // If we reach here, something went wrong with the API
    redirect('/challenges');
  }
}