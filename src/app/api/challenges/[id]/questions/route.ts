import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface SecureQuestion {
  question_id: string;
  text: string;
  choices: { choice_id: string; text: string }[];
  order_index: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = params.id;

    // Verify user is part of this challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("challenger_id, opponent_id, status")
      .eq("challenge_id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (challenge.status !== 'pending') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 });
    }

    // Fetch questions WITHOUT correct answers
    const { data: challengeQuestions, error: questionsError } = await supabase
      .from("challenge_questions")
      .select(`
        order_index,
        question:question_id (
          question_id, 
          text,
          choices!choices_question_id_fkey (
            choice_id,
            text
          )
        )
      `)
      .eq("challenge_id", challengeId)
      .order("order_index");

    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Transform to secure format - NEVER include is_correct
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secureQuestions: SecureQuestion[] = challengeQuestions?.map((cq: any) => ({
      question_id: cq.question.question_id,
      text: cq.question.text,
      choices: cq.question.choices?.map((c: { choice_id: string; text: string }) => ({
        choice_id: c.choice_id,
        text: c.text
        // SECURITY: is_correct field is NEVER sent to client
      })) || [],
      order_index: cq.order_index
    })) || [];

    return NextResponse.json({
      questions: secureQuestions,
      totalQuestions: secureQuestions.length
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
