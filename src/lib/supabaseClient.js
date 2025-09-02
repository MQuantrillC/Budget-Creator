import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('🔧 SUPABASE CLIENT INIT:');
console.log('  URL present:', !!supabaseUrl);
console.log('  URL value:', supabaseUrl || 'MISSING');
console.log('  Key present:', !!supabaseAnonKey);
console.log('  Key length:', supabaseAnonKey?.length || 0);
console.log('  Key starts with:', supabaseAnonKey?.substring(0, 20) || 'MISSING');

// Handle missing environment variables gracefully
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing. Authentication will be disabled.');
  console.log('Expected URL format: https://xxx.supabase.co');
  console.log('Expected Key format: eyJhbGciOiJIUzI1NiIs...');
} else {
  console.log('✅ Supabase client initialized successfully');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
