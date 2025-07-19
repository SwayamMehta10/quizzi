import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables from .env.local
let supabaseUrl, supabaseServiceKey;
try {
  const envContent = readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('Error reading .env.local:', error.message);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugChallengeAccess() {
  const challengeId = '4f644ca0-3c1f-4461-bfc0-485bab75126a';
  
  console.log('=== DEBUGGING CHALLENGE ACCESS ===');
  console.log('Challenge ID:', challengeId);
  console.log('');
  
  // Test 1: Check with service key (should work)
  console.log('1. Testing with service key (bypasses RLS)...');
  const { data: serviceChallenge, error: serviceError } = await supabase
    .from('challenges')
    .select('challenger_id, opponent_id, status')
    .eq('challenge_id', challengeId)
    .single();
  
  console.log('Service key result:', serviceChallenge);
  console.log('Service key error:', serviceError);
  console.log('');
  
  // Test 2: Check all policies on challenges table
  console.log('2. Checking all challenges in database...');
  const { data: allChallenges, error: allError } = await supabase
    .from('challenges')
    .select('*')
    .limit(5);
  
  console.log('All challenges:', allChallenges);
  console.log('All challenges error:', allError);
  
  if (serviceChallenge) {
    console.log('');
    console.log('Challenge details:');
    console.log('- Challenger ID:', serviceChallenge.challenger_id);
    console.log('- Opponent ID:', serviceChallenge.opponent_id);
    console.log('- Status:', serviceChallenge.status);
  }
}

debugChallengeAccess().catch(console.error);
