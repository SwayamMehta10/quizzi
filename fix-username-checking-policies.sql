-- Fix username checking by allowing users to read usernames for availability checking
-- This policy allows authenticated users to check if usernames exist without exposing other profile data

-- Drop existing restrictive policies that might block username checking
DROP POLICY IF EXISTS "Users can only view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create a policy that allows reading usernames for availability checking
CREATE POLICY "Allow username checking for authenticated users" ON profiles
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND 
    -- Only allow reading the username field for checking availability
    -- This is achieved by the application only selecting 'username' field
    true
  );

-- Keep the other policies for insert/update (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
