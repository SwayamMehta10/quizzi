-- QUIZZI DATABASE OPTIMIZATION SCRIPT
-- Run this script in your Supabase SQL Editor
-- This will create indexes and functions to reduce egress usage

-- ===============================================
-- CLEANUP EXISTING SECURITY ISSUES
-- ===============================================

-- Drop the insecure optimization_status view if it exists
DROP VIEW IF EXISTS public.optimization_status;

-- Drop existing text search index that depends on pg_trgm
DROP INDEX IF EXISTS idx_profiles_username_search;

-- Move pg_trgm extension from public to extensions schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- ===============================================
-- PERFORMANCE INDEXES
-- ===============================================

-- Enable the pg_trgm extension in extensions schema (not public)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Composite index for challenges query optimization
CREATE INDEX IF NOT EXISTS idx_challenges_user_status 
ON challenges(challenger_id, opponent_id, challenger_status, opponent_status, created_at DESC);

-- Index for friends queries
CREATE INDEX IF NOT EXISTS idx_friends_user_ids 
ON friends(user_id1, user_id2);

-- Index for friend requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status 
ON friend_requests(receiver_id, status);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_status 
ON friend_requests(sender_id, status);

-- Index for answers by challenge and user
CREATE INDEX IF NOT EXISTS idx_answers_challenge_user 
ON answers(challenge_id, user_id, question_id);

-- Index for challenge results
CREATE INDEX IF NOT EXISTS idx_challenge_results_challenge 
ON challenge_results(challenge_id);

-- Index for questions by topic
CREATE INDEX IF NOT EXISTS idx_questions_topic_difficulty 
ON questions(topic_id, difficulty);

-- Partial index for active challenges only (more efficient)
CREATE INDEX IF NOT EXISTS idx_challenges_active 
ON challenges(challenger_id, opponent_id) 
WHERE challenger_status IN ('pending', 'accepted', 'playing') 
   OR opponent_status IN ('pending', 'accepted', 'playing');

-- Index for profiles username search (using extensions schema)
CREATE INDEX IF NOT EXISTS idx_profiles_username_search 
ON profiles USING gin(username gin_trgm_ops);

-- ===============================================
-- OPTIMIZED FUNCTIONS (Optional but recommended)
-- ===============================================

-- Function to get user challenges with minimal data transfer
CREATE OR REPLACE FUNCTION get_user_challenges_optimized(
  user_id UUID, 
  limit_count INT DEFAULT 20, 
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  challenge_id UUID,
  challenger_id UUID,
  opponent_id UUID,
  challenger_status TEXT,
  opponent_status TEXT,
  created_at TIMESTAMPTZ,
  topic_id UUID,
  topic_name TEXT,
  challenger_username TEXT,
  challenger_avatar TEXT,
  opponent_username TEXT,
  opponent_avatar TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.challenge_id,
    c.challenger_id,
    c.opponent_id,
    c.challenger_status,
    c.opponent_status,
    c.created_at,
    c.topic_id,
    t.name as topic_name,
    p1.username as challenger_username,
    p1.avatar_url as challenger_avatar,
    p2.username as opponent_username,
    p2.avatar_url as opponent_avatar
  FROM challenges c
  LEFT JOIN topics t ON c.topic_id = t.topic_id
  LEFT JOIN profiles p1 ON c.challenger_id = p1.id
  LEFT JOIN profiles p2 ON c.opponent_id = p2.id
  WHERE c.challenger_id = user_id OR c.opponent_id = user_id
  ORDER BY c.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to get friends with minimal data
CREATE OR REPLACE FUNCTION get_user_friends_optimized(user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  username TEXT,
  avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id1 = user_id THEN f.user_id2 
      ELSE f.user_id1 
    END as friend_id,
    p.username,
    p.avatar_url
  FROM friends f
  JOIN profiles p ON (
    CASE 
      WHEN f.user_id1 = user_id THEN p.id = f.user_id2
      ELSE p.id = f.user_id1
    END
  )
  WHERE f.user_id1 = user_id OR f.user_id2 = user_id;
END;
$$;

-- ===============================================
-- FIX EXISTING FUNCTION SECURITY ISSUES
-- ===============================================

-- Fix the handle_new_user function search_path security issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN new;
END;
$$;

-- ===============================================
-- SECURITY POLICIES (Review and adjust as needed)
-- ===============================================

-- Enable RLS on all tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see basic info of other users for game purposes
DROP POLICY IF EXISTS "profiles_select_basic" ON profiles;
CREATE POLICY "profiles_select_basic" ON profiles 
FOR SELECT USING (true);

-- Profiles: Users can only update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Challenges: Users can only see their own challenges
DROP POLICY IF EXISTS "challenges_select_own" ON challenges;
CREATE POLICY "challenges_select_own" ON challenges 
FOR SELECT USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

-- Challenge results: Users can only see results for their challenges
DROP POLICY IF EXISTS "challenge_results_select_own" ON challenge_results;
CREATE POLICY "challenge_results_select_own" ON challenge_results 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM challenges 
    WHERE challenges.challenge_id = challenge_results.challenge_id 
    AND (challenger_id = auth.uid() OR opponent_id = auth.uid())
  )
);

-- Friends: Users can see their friendships
DROP POLICY IF EXISTS "friends_select_own" ON friends;
CREATE POLICY "friends_select_own" ON friends 
FOR SELECT USING (user_id1 = auth.uid() OR user_id2 = auth.uid());

-- Friend requests: Users can see requests they sent or received
DROP POLICY IF EXISTS "friend_requests_select_own" ON friend_requests;
CREATE POLICY "friend_requests_select_own" ON friend_requests 
FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- ===============================================
-- COMPLETION MESSAGE
-- ===============================================

-- Database optimization completed successfully!
-- Check your Supabase egress usage in 24 hours to see the reduction.
-- 
-- Optimizations applied:
-- ✅ Performance indexes created
-- ✅ Optimized functions deployed  
-- ✅ Security policies configured
-- ✅ Security warnings addressed
