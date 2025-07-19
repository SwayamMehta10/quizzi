-- SUPABASE AUTH SECURITY CONFIGURATION
-- Run this in your Supabase SQL Editor AFTER running database-optimizations.sql
-- This addresses the leaked password protection warning

-- ===============================================
-- AUTH SECURITY SETTINGS
-- ===============================================

-- Note: Leaked password protection must be enabled in Supabase Dashboard
-- Go to: Authentication > Settings > Password Protection
-- Enable "Check for Compromised Passwords"
-- 
-- This cannot be enabled via SQL - it's a dashboard setting only.
-- 
-- Alternative: You can also enable it via the Supabase CLI:
-- supabase secrets set AUTH_PASSWORD_LEAK_PROTECTION=true

-- ===============================================
-- ADDITIONAL AUTH SECURITY POLICIES
-- ===============================================

-- Ensure strong password requirements (if you want to set minimum length)
-- This is also typically done in the dashboard under Authentication > Settings

SELECT 'Auth security configuration completed!' as message,
       'Enable leaked password protection in Supabase Dashboard > Authentication > Settings' as next_step;
