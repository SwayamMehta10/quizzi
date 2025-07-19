-- CONSOLIDATE DUPLICATE RLS POLICIES
-- This script removes duplicate policies that cause "Multiple Permissive Policies" warnings
-- while maintaining the same functionality and security model
--
-- Run this AFTER running optimize-rls-policies.sql

-- ===============================================
-- PROFILES TABLE - REMOVE DUPLICATES
-- ===============================================

-- Keep "Enable read access for all users" and remove "profiles_select_basic" (they're identical)
DROP POLICY IF EXISTS "profiles_select_basic" ON profiles;

-- Keep "Enable update for users based on their ID" and remove "profiles_update_own" (they're identical)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- ===============================================
-- FRIENDS TABLE - REMOVE DUPLICATES
-- ===============================================

-- Keep "Users can view their own friendships" and remove "friends_select_own" (they're identical)
DROP POLICY IF EXISTS "friends_select_own" ON friends;

-- ===============================================
-- FRIEND_REQUESTS TABLE - REMOVE DUPLICATES
-- ===============================================

-- Keep individual policies and remove the generic "friend_requests_select_own" 
-- (the specific policies are more granular and better for security)
DROP POLICY IF EXISTS "friend_requests_select_own" ON friend_requests;

-- ===============================================
-- CHALLENGES TABLE - REMOVE DUPLICATES
-- ===============================================

-- Keep "Users can view their challenges" and remove "Users can read challenges they participate in" 
-- (they have the same logic but "Users can view their challenges" is clearer)
DROP POLICY IF EXISTS "Users can read challenges they participate in" ON challenges;

-- Keep "challenges_select_own" and remove other duplicates (it's the most generic)
-- Actually, let's keep the more descriptive ones and remove the generic one
DROP POLICY IF EXISTS "challenges_select_own" ON challenges;

-- For UPDATE operations, consolidate into one policy
DROP POLICY IF EXISTS "Users can update their own status in challenges" ON challenges;
-- Keep "Users can update their challenges" as it's more comprehensive

-- ===============================================
-- CHALLENGE_RESULTS TABLE - REMOVE DUPLICATES
-- ===============================================

-- Keep "Users can read results for challenges they participated in" (most descriptive)
-- Remove the other two SELECT policies that do the same thing
DROP POLICY IF EXISTS "Users can view results for their challenges" ON challenge_results;
DROP POLICY IF EXISTS "challenge_results_select_own" ON challenge_results;

-- ===============================================
-- ANSWERS TABLE - REMOVE DUPLICATES
-- ===============================================

-- Keep both policies as they serve different purposes:
-- "Users can read their own answers" - for individual user access
-- "Challenge participants can see all answers in their challenges" - for game functionality
-- These are not actually duplicates, they complement each other

-- ===============================================
-- VALIDATION QUERY
-- ===============================================

-- Check remaining policies after consolidation
SELECT 
  tablename, 
  COUNT(*) as policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'challenges', 'challenge_results', 'friends', 'friend_requests', 'answers')
GROUP BY tablename
ORDER BY tablename;

-- ===============================================
-- COMPLETION STATUS
-- ===============================================

SELECT 
  'Duplicate Policy Consolidation Completed!' as status,
  'Removed redundant policies while maintaining functionality' as consolidation_result,
  'Should significantly reduce multiple permissive policy warnings' as expected_impact,
  'If any warnings remain, run final-policy-consolidation.sql' as next_step;
