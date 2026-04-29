import { supabaseAdmin } from './supabaseAdmin';

/**
 * Middleware helper to verify staff tokens
 * Usage: const staff = await verifyToken(req.headers['x-staff-token']);
 * Returns the staff session object if valid, or null if invalid/expired.
 */
export async function verifyToken(token: string | string[] | undefined) {
  if (!token || typeof token !== 'string') return null;

  try {
    const { data: session, error } = await supabaseAdmin
      .from('staff_sessions')
      .select('staff_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !session) return null;

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      // Token expired, delete it and return null
      await supabaseAdmin.from('staff_sessions').delete().eq('token', token);
      return null;
    }

    return session;
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}
