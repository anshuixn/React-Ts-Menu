import { createClient } from '@supabase/supabase-js';

// Use a valid URL format for the placeholder so createClient doesn't crash the entire app 
// before the user has a chance to enter their real credentials.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://placeholder.supabase.co';
  
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase credentials missing or invalid. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
