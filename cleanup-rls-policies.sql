-- Cleanup script to remove redundant RLS policy
-- This removes the extra policy that was added and might be causing conflicts

-- Remove the redundant policy that duplicates existing functionality
DROP POLICY IF EXISTS "challenge_participants_read_access" ON challenges;

-- The existing policies already handle this:
-- 1. "Users can view their challenges" - FOR SELECT TO authenticated
-- 2. "Users can read challenges they participate in" - FOR SELECT TO authenticated
-- 3. "challenges_select_own" - FOR SELECT TO public

-- Optionally, verify the remaining policies are working correctly
-- You can uncomment the following to see what policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'challenges';
