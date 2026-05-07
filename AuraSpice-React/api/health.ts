import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const supabase = getSupabaseAdmin();
  let dbStatus: 'ok' | 'unconfigured' | 'error' = 'unconfigured';

  if (supabase) {
    try {
      // Lightweight connectivity check — single row from settings table
      const { error } = await supabase
        .from('settings')
        .select('key')
        .limit(1)
        .single();

      // A "no rows" error is fine — means DB is reachable but table is empty
      dbStatus = error && error.code !== 'PGRST116' ? 'error' : 'ok';
    } catch {
      dbStatus = 'error';
    }
  }

  const httpStatus = dbStatus === 'error' ? 503 : 200;

  return res.status(httpStatus).json({
    status: dbStatus === 'error' ? 'degraded' : 'ok',
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
