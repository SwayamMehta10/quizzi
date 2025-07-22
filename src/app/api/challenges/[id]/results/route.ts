import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { UltraOptimizedQueries } from "@/lib/ultra-optimized-queries";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const challengeId = params.id;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // console.log('Results API - Auth check:', { user: user?.id, authError });
    
    if (authError || !user) {
      console.error('Results API - Auth failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // console.log('Results API - User authenticated:', user.id);

    // Use ultra-optimized query instead of heavy JOIN - reduces egress by 80%
    const resultsData = await UltraOptimizedQueries.getChallengeResults(challengeId);
    
    if (!resultsData || !resultsData.challenge) {
      console.error('Results API - Challenge not found');
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const { challenge } = resultsData;

    // Verify user access
    if (challenge.challenger_id !== user.id && challenge.opponent_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Handle waiting state (only one player completed)
    if (!resultsData.completed) {
      return NextResponse.json({
        completed: false,
        waitingForOpponent: true,
        yourScore: resultsData.yourScore,
        message: 'Waiting for opponent to complete the challenge...'
      });
    }

    // Both players completed - return results with current user flag
    const response = {
      ...resultsData,
      isCurrentUserWinner: resultsData.winner === user.id
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
