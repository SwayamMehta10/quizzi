-- Update RLS policies for answers table to allow challenge participants to see each other's answers

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can only see their own answers" ON answers;

-- Create new policy that allows challenge participants to see each other's answers
CREATE POLICY "Challenge participants can see all answers in their challenges" ON answers
FOR SELECT USING (
  challenge_id IN (
    SELECT challenge_id 
    FROM challenges 
    WHERE challenger_id = auth.uid() OR opponent_id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
