import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic_id, challenger_id, opponent_id } = await request.json();

    // Validate input
    if (!topic_id || !challenger_id || !opponent_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the authenticated user is the challenger
    if (user.id !== challenger_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .insert({
        topic_id,
        challenger_id,
        opponent_id,
        challenger_status: "pending",
        opponent_status: "pending"
      })
      .select()
      .single();

    if (challengeError) {
      console.error("Error creating challenge:", challengeError);
      return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
    }

    // Get all questions from the topic first
    const { data: allQuestions, error: questionsError } = await supabase
      .from("questions")
      .select("question_id")
      .eq("topic_id", topic_id);

    if (questionsError || !allQuestions || allQuestions.length === 0) {
      console.error("Error fetching questions:", questionsError);
      // Clean up the challenge if we can't get questions
      await supabase
        .from("challenges")
        .delete()
        .eq("challenge_id", challenge.challenge_id);
      
      return NextResponse.json({ error: "No questions available for this topic" }, { status: 400 });
    }

    // Randomly select 7 questions (or all if fewer than 7)
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, Math.min(7, shuffled.length));

    // Create challenge_questions entries
    const challengeQuestions = questions.map((q, index) => ({
      challenge_id: challenge.challenge_id,
      question_id: q.question_id,
      order_index: index
    }));

    const { error: challengeQuestionsError } = await supabase
      .from("challenge_questions")
      .insert(challengeQuestions);

    if (challengeQuestionsError) {
      console.error("Error creating challenge questions:", challengeQuestionsError);
      // Clean up the challenge if we can't create questions
      await supabase
        .from("challenges")
        .delete()
        .eq("challenge_id", challenge.challenge_id);
      
      return NextResponse.json({ error: "Failed to create challenge questions" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      challenge_id: challenge.challenge_id,
      questions_count: questions.length
    });

  } catch (error) {
    console.error("Error in challenge creation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
