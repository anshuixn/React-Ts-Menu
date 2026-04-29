import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Helper: Supabase Admin Client
// Uses the Service Role Key to bypass RLS for auth operations
// NEVER expose this to the frontend

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
