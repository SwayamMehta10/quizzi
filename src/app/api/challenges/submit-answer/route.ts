import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SecurityAuditor } from "@/lib/security-auditor";
import { RequestValidator } from "@/lib/request-validator";

interface AnswerSubmissionRequest {
  challengeId: string;
  questionId: string;
  choiceId: string | null;
  timeTaken: number;
  questionOrder: number;
  questionStartTime?: number; // Client timestamp when question started
}

interface ScoreCalculationResult {
  isCorrect: boolean;
  baseScore: number;
  multiplier: number;
  totalScore: number;
  timeBonus: number;
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate request before processing
    const validationError = RequestValidator.validate(request, {
      allowedMethods: ['POST'],
      requiredHeaders: ['content-type'],
      rateLimitPerMinute: 30 // Limit to 30 submissions per minute per IP
    });
    
    if (validationError) {
      return validationError;
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error in submit-answer API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    // console.log('Request body:', requestBody);
    
    const { 
      challengeId, 
      questionId, 
      choiceId, 
      timeTaken, 
      questionOrder
    }: AnswerSubmissionRequest = requestBody;

    // console.log('Submit-answer API - User ID:', user.id);
    // console.log('Submit-answer API - Challenge ID:', challengeId);

    // Enhanced validation
    if (!challengeId || !questionId || timeTaken < 0 || timeTaken > 10) {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    // Verify user is part of this challenge
    // console.log('Querying challenge with ID:', challengeId);
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("challenger_id, opponent_id")
      .eq("challenge_id", challengeId)
      .single();

    // console.log('Challenge query result:', { challenge, challengeError });

    if (challengeError || !challenge) {
      console.error('Challenge not found or error:', challengeError);
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if answer already exists (prevent duplicate submissions)
    const { data: existingAnswer } = await supabase
      .from("answers")
      .select("answer_id, answered_at")
      .eq("challenge_id", challengeId)
      .eq("question_id", questionId)
      .eq("user_id", user.id)
      .single();

    if (existingAnswer) {
      // SECURITY: Log duplicate submission attempt
      await SecurityAuditor.logSecurityEvent(
        supabase,
        user.id,
        challengeId,
        'duplicate_submission',
        `Attempted duplicate answer for question ${questionId}`,
        'medium',
        request
      );
      return NextResponse.json({ error: 'Answer already submitted for this question' }, { status: 400 });
    }

    // SECURITY: Rate limiting - prevent rapid submissions
    const { data: recentAnswers } = await supabase
      .from("answers")
      .select("answered_at")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .gte("answered_at", new Date(Date.now() - 5000).toISOString()) // Last 5 seconds
      .order("answered_at", { ascending: false });

    if (recentAnswers && recentAnswers.length > 0) {
      const lastAnswer = new Date(recentAnswers[0].answered_at).getTime();
      const timeSinceLastAnswer = Date.now() - lastAnswer;
      
      if (timeSinceLastAnswer < 500) { // Minimum 0.5 seconds between answers
        // SECURITY: Log rate limiting hit
        await SecurityAuditor.logSecurityEvent(
          supabase,
          user.id,
          challengeId,
          'rate_limit_hit',
          `Rapid submission detected: ${timeSinceLastAnswer}ms since last answer`,
          'high',
          request
        );
        return NextResponse.json({ error: 'Please wait before submitting another answer' }, { status: 429 });
      }
    }

    // Get question details for validation
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select(`
        question_id,
        text,
        choices!choices_question_id_fkey (
          choice_id,
          text,
          is_correct
        )
      `)
      .eq("question_id", questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Calculate score with business logic
    let isCorrect = false;
    let scoreCalculation: ScoreCalculationResult = {
      isCorrect: false,
      baseScore: 0,
      multiplier: 1,
      totalScore: 0,
      timeBonus: 0
    };

    if (choiceId) {
      const selectedChoice = question.choices.find(c => c.choice_id === choiceId);
      if (selectedChoice) {
        isCorrect = selectedChoice.is_correct;
        
        if (isCorrect) {
          const timeBonus = Math.max(0, 10 - timeTaken);
          const baseScore = 10 + timeBonus;
          const multiplier = questionOrder === 7 ? 2 : 1; // Double points for 7th question
          const totalScore = baseScore * multiplier;

          scoreCalculation = {
            isCorrect: true,
            baseScore,
            multiplier,
            totalScore,
            timeBonus
          };
        }
      }
    }

    // Store answer in database
    const { error: answerError } = await supabase
      .from('answers')
      .insert({
        challenge_id: challengeId,
        question_id: questionId,
        choice_id: choiceId,
        user_id: user.id,
        is_correct: isCorrect,
        time_taken: timeTaken,
        points_scored: scoreCalculation.totalScore,
        answered_at: new Date().toISOString()
      });

    if (answerError) {
      console.error('Error storing answer:', answerError);
      return NextResponse.json({ error: 'Failed to store answer' }, { status: 500 });
    }

    // SECURITY: Log successful answer submission
    await SecurityAuditor.logSecurityEvent(
      supabase,
      user.id,
      challengeId,
      'answer_submission',
      `Answer submitted for question ${questionId}, correct: ${isCorrect}, time: ${timeTaken}s`,
      'low',
      request
    );

    // Return result WITHOUT exposing correct answer for security
    return NextResponse.json({
      success: true,
      result: {
        isCorrect,
        scoreCalculation,
        questionText: question.text
        // SECURITY: Never return correctChoice to prevent cheating
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get challenge progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID required' }, { status: 400 });
    }

    // Get user's answers for this challenge
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select(`
        question_id,
        is_correct,
        time_taken,
        answered_at,
        question!answers_question_id_fkey (
          text
        )
      `)
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .order("answered_at");

    if (answersError) {
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    // Calculate current score
    let totalScore = 0;
    answers?.forEach((answer, index) => {
      if (answer.is_correct) {
        const timeBonus = Math.max(0, 10 - (answer.time_taken || 10));
        const baseScore = 10 + timeBonus;
        const multiplier = (index + 1) === 7 ? 2 : 1;
        totalScore += baseScore * multiplier;
      }
    });

    return NextResponse.json({
      totalScore,
      answersCount: answers?.length || 0,
      answers: answers || []
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
