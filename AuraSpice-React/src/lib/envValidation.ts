import { z } from 'zod';

const PLACEHOLDER_URL = 'https://your-project.supabase.co';
const PLACEHOLDER_KEY = 'your-public-anon-key';

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL')
    .startsWith('https://', 'VITE_SUPABASE_URL must use HTTPS'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_ANON_KEY is required'),
});

/**
 * Checks whether the configured Supabase env vars are real credentials
 * (not the placeholder values from .env.example).
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return (
    !!url &&
    url !== PLACEHOLDER_URL &&
    !url.includes('your-project') &&
    !!key &&
    key !== PLACEHOLDER_KEY &&
    !key.includes('your-')
  );
}

/**
 * Validates client-side environment variables.
 * In development: logs a warning and allows the app to boot in demo/offline mode.
 * In production: throws so deployment fails fast if credentials are missing.
 */
export function validateClientEnv(): void {
  // Skip validation if env vars look like real credentials
  if (isSupabaseConfigured()) return;

  const result = clientEnvSchema.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    const notice =
      `\n[AuraSpice] Supabase credentials not configured.\n${messages}\n\n` +
      'Running in DEMO MODE — menu shows static data, orders won\'t persist.\n' +
      'Fill in .env.local with real credentials for full functionality.\n';

    if (import.meta.env.PROD) {
      // In a real production build, missing credentials is a hard error
      throw new Error(notice);
    } else {
      // In development / local preview, warn and continue gracefully
      console.warn(notice);
    }
  }
}
