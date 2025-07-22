-- Fix for challenge access RLS policy issue
-- This addresses the "JSON object requested, multiple (or no) rows returned" error
-- when users try to access existing challenges

-- Add a specific policy for challenge participants with explicit type casting
-- This ensures that UUID comparisons work correctly
DROP POLICY IF EXISTS "challenge_participants_read_access" ON challenges;
CREATE POLICY "challenge_participants_read_access" ON challenges
FOR SELECT TO authenticated
USING (
  (auth.uid()::text = challenger_id::text) OR 
  (auth.uid()::text = opponent_id::text)
);

-- Ensure RLS is enabled on challenges table
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Add index to improve performance of RLS policy checks if not exists
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent_id ON challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_challenges_participants ON challenges(challenger_id, opponent_id);
