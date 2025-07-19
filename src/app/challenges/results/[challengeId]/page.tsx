import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ChallengePageProps } from "@/types/challenges";
import ChallengeResults from "@/features/game/challenge-results";

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
    // Fetch challenge details with optimized query
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

    // Verify user access
    if (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id) {
      redirect('/challenges');
    }

    // Check completion status using challenge_results table
    const { data: allResults } = await supabase
      .from("challenge_results")
      .select("*")
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

    // Parallel queries for better performance
    const [answersResult, questionsResult] = await Promise.all([
      supabase
        .from("answers")
        .select(`
          *,
          question:question_id (
            question_id,
            text,
            choices:question_id (
              choice_id,
              text,
              is_correct
            )
          ),
          choice:choice_id (
            choice_id,
            text,
            is_correct
          )
        `)
        .eq("challenge_id", challengeId)
        .order("answered_at"),

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

    // Process data
    const questionOrderMap = new Map(
      questionsResult.data.map(cq => [cq.question_id, cq.order_index + 1])
    );

    const challengerAnswers: Answer[] = [];
    const opponentAnswers: Answer[] = [];

    answersResult.data?.forEach(answer => {
      const questionOrder = questionOrderMap.get(answer.question_id) || 0;
      const correctChoice = answer.question.choices.find((c: { is_correct: boolean; text: string }) => c.is_correct)?.text || 'N/A';
      
      const processedAnswer: Answer = {
        question_id: answer.question_id,
        question_text: answer.question.text,
        user_id: answer.user_id,
        choice_id: answer.choice_id,
        choice_text: answer.choice?.text || null,
        is_correct: answer.is_correct,
        time_taken: answer.time_taken || 10,
        correct_choice: correctChoice,
        question_order: questionOrder
      };

      if (answer.user_id === challenge.challenger_id) {
        challengerAnswers.push(processedAnswer);
      } else if (answer.user_id === challenge.opponent_id) {
        opponentAnswers.push(processedAnswer);
      }
    });

    // Calculate scores with business logic
    const calculateScore = (answers: Answer[]) => {
      return answers.reduce((total, answer) => {
        if (answer.is_correct) {
          const baseScore = 10 + Math.max(0, 10 - answer.time_taken);
          const multiplier = answer.question_order === 7 ? 2 : 1; // Double points for 7th question
          return total + (baseScore * multiplier);
        }
        return total;
      }, 0);
    };

    const challengerResult: PlayerResult = {
      user_id: challenge.challenger_id,
      username: challenge.challenger.username,
      avatar_url: challenge.challenger.avatar_url || '',
      total_score: calculateScore(challengerAnswers),
      answers: challengerAnswers.sort((a, b) => a.question_order - b.question_order)
    };

    const opponentResult: PlayerResult = {
      user_id: challenge.opponent_id,
      username: challenge.opponent.username,
      avatar_url: challenge.opponent.avatar_url || '',
      total_score: calculateScore(opponentAnswers),
      answers: opponentAnswers.sort((a, b) => a.question_order - b.question_order)
    };

    // Determine winner
    let winner: string | null = null;
    if (challengerResult.total_score > opponentResult.total_score) {
      winner = challenge.challenger_id;
    } else if (opponentResult.total_score > challengerResult.total_score) {
      winner = challenge.opponent_id;
    } else {
      winner = null; // It's a tie
    }

    // Update the challenge with completion timestamp (if not already set)
    await supabase
      .from('challenges')
      .update({ 
        completed_at: new Date().toISOString()
      })
      .eq('challenge_id', challengeId);

    const resultsData: ChallengeResultsResponse = {
      challenger: challengerResult,
      opponent: opponentResult,
      topicName: challenge.topic?.name || 'Unknown Topic',
      challenge,
      winner: winner,
      isCurrentUserWinner: winner === user.id,
      isTie: winner === null
    };

    // Handle normal results display
    const { challenger, opponent, topicName, winner: resultWinner, isCurrentUserWinner, isTie } = resultsData;

    return (
      <div className="container mx-auto py-8 px-4">
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