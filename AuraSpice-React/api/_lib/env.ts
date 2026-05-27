export const AUTH_COOKIE_NAME = 'aura_staff_session';
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 12;

type RequiredServerEnvVar = 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'JWT_SECRET';

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function requireEnv(name: RequiredServerEnvVar): string {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAllowedOrigins(): string[] {
  const configuredOrigins = readEnv('ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    // Also allow any localhost port for flexible local dev
    'http://localhost:4173',  // vite preview
  ];

  const vercelOrigin = readEnv('VERCEL_URL');

  if (vercelOrigin) {
    defaultOrigins.push(`https://${vercelOrigin}`);
  }

  return [...new Set([...configuredOrigins, ...defaultOrigins])];
}

export function getServerEnv() {
  return {
    supabaseUrl: requireEnv('SUPABASE_URL'),
    supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret: requireEnv('JWT_SECRET'),
  };
}

export function isProductionEnvironment(): boolean {
  // VERCEL_ENV is 'development' when running via `vercel dev` locally,
  // even though NODE_ENV may be 'production'. Always trust VERCEL_ENV first.
  if (process.env.VERCEL_ENV === 'development') return false;
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}
