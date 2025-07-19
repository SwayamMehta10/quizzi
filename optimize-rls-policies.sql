-- OPTIMIZED RLS POLICIES FOR PERFORMANCE
-- This script addresses Supabase performance advisor warnings by:
-- 1. Fixing Auth RLS Initialization Plan issues with (select auth.uid())
-- 2. Keeping all existing policies but optimizing their performance
-- 
-- Run this in your Supabase SQL Editor to optimize performance

-- ===============================================
-- BACKUP EXISTING POLICIES (Optional - for safety)
-- ===============================================

-- You can uncomment these lines to see current policies before changes:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies WHERE schemaname = 'public';

-- ===============================================
-- PROFILES TABLE OPTIMIZATION
-- ===============================================

-- Update existing policies with optimized auth calls
DROP POLICY IF EXISTS "Enable update for users based on their ID" ON profiles;
CREATE POLICY "Enable update for users based on their ID" ON profiles
FOR UPDATE TO public
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE TO public
USING ((select auth.uid()) = id);

-- ===============================================
-- FRIENDS TABLE OPTIMIZATION
-- ===============================================

-- Update existing policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view their own friendships" ON friends;
CREATE POLICY "Users can view their own friendships" ON friends
FOR SELECT TO public
USING (((select auth.uid()) = user_id1) OR ((select auth.uid()) = user_id2));

DROP POLICY IF EXISTS "Users can remove their own friends" ON friends;
CREATE POLICY "Users can remove their own friends" ON friends
FOR DELETE TO public
USING (((select auth.uid()) = user_id1) OR ((select auth.uid()) = user_id2));

DROP POLICY IF EXISTS "Users can create friendships from accepted requests" ON friends;
CREATE POLICY "Users can create friendships from accepted requests" ON friends
FOR INSERT TO public
WITH CHECK (((select auth.uid()) = user_id1) OR ((select auth.uid()) = user_id2));

DROP POLICY IF EXISTS "friends_select_own" ON friends;
CREATE POLICY "friends_select_own" ON friends
FOR SELECT TO public
USING (((select auth.uid()) = user_id1) OR ((select auth.uid()) = user_id2));

-- ===============================================
-- FRIEND_REQUESTS TABLE OPTIMIZATION
-- ===============================================

-- Update existing policies with optimized auth calls
DROP POLICY IF EXISTS "Users can view friend requests they've received" ON friend_requests;
CREATE POLICY "Users can view friend requests they've received" ON friend_requests
FOR SELECT TO public
USING ((select auth.uid()) = receiver_id);

DROP POLICY IF EXISTS "Users can view friend requests they've sent" ON friend_requests;
CREATE POLICY "Users can view friend requests they've sent" ON friend_requests
FOR SELECT TO public
USING ((select auth.uid()) = sender_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
CREATE POLICY "Users can send friend requests" ON friend_requests
FOR INSERT TO public
WITH CHECK (((select auth.uid()) = sender_id) AND ((select auth.uid()) <> receiver_id) AND (NOT (EXISTS ( SELECT 1
   FROM friends
  WHERE (((friends.user_id1 = friend_requests.sender_id) AND (friends.user_id2 = friend_requests.receiver_id)) OR ((friends.user_id1 = friend_requests.receiver_id) AND (friends.user_id2 = friend_requests.sender_id)))))));

DROP POLICY IF EXISTS "Users can update friend requests they've received" ON friend_requests;
CREATE POLICY "Users can update friend requests they've received" ON friend_requests
FOR UPDATE TO public
USING ((select auth.uid()) = receiver_id)
WITH CHECK ((select auth.uid()) = receiver_id);

DROP POLICY IF EXISTS "Users can delete friend requests they've sent" ON friend_requests;
CREATE POLICY "Users can delete friend requests they've sent" ON friend_requests
FOR DELETE TO public
USING (((select auth.uid()) = sender_id) AND (status = 'pending'::text));

DROP POLICY IF EXISTS "friend_requests_select_own" ON friend_requests;
CREATE POLICY "friend_requests_select_own" ON friend_requests
FOR SELECT TO public
USING (((select auth.uid()) = sender_id) OR ((select auth.uid()) = receiver_id));

-- ===============================================
-- CHALLENGES TABLE OPTIMIZATION
-- ===============================================

-- Update existing policies with optimized auth calls
DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
CREATE POLICY "Users can create challenges" ON challenges
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = challenger_id);

DROP POLICY IF EXISTS "Users can view their challenges" ON challenges;
CREATE POLICY "Users can view their challenges" ON challenges
FOR SELECT TO authenticated
USING (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = opponent_id));

DROP POLICY IF EXISTS "Users can update their challenges" ON challenges;
CREATE POLICY "Users can update their challenges" ON challenges
FOR UPDATE TO authenticated
USING (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = opponent_id))
WITH CHECK (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = opponent_id));

DROP POLICY IF EXISTS "Users can read challenges they participate in" ON challenges;
CREATE POLICY "Users can read challenges they participate in" ON challenges
FOR SELECT TO authenticated
USING ((((select auth.uid()))::text = (challenger_id)::text) OR (((select auth.uid()))::text = (opponent_id)::text));

DROP POLICY IF EXISTS "Users can update their own status in challenges" ON challenges;
CREATE POLICY "Users can update their own status in challenges" ON challenges
FOR UPDATE TO authenticated
USING (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = opponent_id))
WITH CHECK (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = opponent_id));

DROP POLICY IF EXISTS "challenges_select_own" ON challenges;
CREATE POLICY "challenges_select_own" ON challenges
FOR SELECT TO public
USING (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = opponent_id));

-- ===============================================
-- CHALLENGE_RESULTS TABLE OPTIMIZATION
-- ===============================================

-- Update existing policies with optimized auth calls
DROP POLICY IF EXISTS "Users can insert their own challenge results" ON challenge_results;
CREATE POLICY "Users can insert their own challenge results" ON challenge_results
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read results for challenges they participated in" ON challenge_results;
CREATE POLICY "Users can read results for challenges they participated in" ON challenge_results
FOR SELECT TO authenticated
USING (EXISTS ( SELECT 1
   FROM challenges
  WHERE ((challenges.challenge_id = challenge_results.challenge_id) AND (((select auth.uid()) = challenges.challenger_id) OR ((select auth.uid()) = challenges.opponent_id)))));

DROP POLICY IF EXISTS "Users can view results for their challenges" ON challenge_results;
CREATE POLICY "Users can view results for their challenges" ON challenge_results
FOR SELECT TO public
USING (EXISTS ( SELECT 1
   FROM challenges
  WHERE ((challenges.challenge_id = challenge_results.challenge_id) AND (((select auth.uid()) = challenges.challenger_id) OR ((select auth.uid()) = challenges.opponent_id)))));

DROP POLICY IF EXISTS "challenge_results_select_own" ON challenge_results;
CREATE POLICY "challenge_results_select_own" ON challenge_results
FOR SELECT TO public
USING (EXISTS ( SELECT 1
   FROM challenges
  WHERE ((challenges.challenge_id = challenge_results.challenge_id) AND (((select auth.uid()) = challenges.challenger_id) OR ((select auth.uid()) = challenges.opponent_id)))));

-- ===============================================
-- ANSWERS TABLE OPTIMIZATION
-- ===============================================

-- Update existing policies with optimized auth calls
DROP POLICY IF EXISTS "Users can insert their own answers" ON answers;
CREATE POLICY "Users can insert their own answers" ON answers
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read their own answers" ON answers;
CREATE POLICY "Users can read their own answers" ON answers
FOR SELECT TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Challenge participants can see all answers in their challenges" ON answers;
CREATE POLICY "Challenge participants can see all answers in their challenges" ON answers
FOR SELECT TO public
USING (challenge_id IN ( SELECT challenges.challenge_id
   FROM challenges
  WHERE (((select auth.uid()) = challenges.challenger_id) OR ((select auth.uid()) = challenges.opponent_id))));

-- ===============================================
-- ENSURE RLS IS ENABLED ON ALL TABLES
-- ===============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PERFORMANCE VALIDATION QUERIES
-- ===============================================

-- Run these queries to validate the optimizations:

-- Check that all policies have been updated with optimized auth calls
SELECT 
  tablename, 
  policyname,
  CASE 
    WHEN qual ~ '\(select auth\.uid\(\)\)' OR with_check ~ '\(select auth\.uid\(\)\)' THEN 'OPTIMIZED'
    WHEN qual ~ 'auth\.uid\(\)' OR with_check ~ 'auth\.uid\(\)' THEN 'NEEDS_OPTIMIZATION'
    ELSE 'NO_AUTH_CALLS'
  END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'challenges', 'challenge_results', 'friends', 'friend_requests', 'answers')
ORDER BY tablename, policyname;

-- ===============================================
-- COMPLETION STATUS
-- ===============================================

SELECT 
  'RLS Policy Optimization Completed!' as status,
  'All auth.uid() calls optimized with (select auth.uid())' as auth_optimization,
  'All existing policies preserved with performance improvements' as policy_preservation,
  'Performance should be significantly improved while maintaining functionality' as expected_result;

-- ===============================================
-- NEXT STEPS
-- ===============================================

-- 1. Test your application to ensure all functionality still works
-- 2. Monitor Supabase performance metrics for improvements
-- 3. Re-run the Supabase performance advisor to confirm auth initialization warnings are resolved
-- 4. The multiple permissive policies warnings will remain but performance is still improved
-- 5. Consider application-level caching for frequently accessed data
