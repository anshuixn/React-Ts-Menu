import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { supabaseAdmin } from '../_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { id, password } = req.body;

  if (!id || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  try {
    // 1. Fetch user from Supabase using Service Role (bypasses RLS)
    const { data: user, error } = await supabaseAdmin
      .from('staff_accounts')
      .select('id, name, role, password_hash')
      .eq('id', id)
      .single();

    if (error || !user) {
      // Return generic error to prevent user enumeration
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 2. Verify password with bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 3. Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 12 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    // 4. Store token in staff_sessions
    const { error: sessionError } = await supabaseAdmin
      .from('staff_sessions')
      .insert({
        token,
        staff_id: user.id,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    // 5. Return success with token and account info (omit password_hash)
    return res.status(200).json({
      success: true,
      token,
      account: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
