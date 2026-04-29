import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const token = req.headers['x-staff-token'];

  if (!token || typeof token !== 'string') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Delete session from DB
    const { error } = await supabaseAdmin
      .from('staff_sessions')
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    return res.status(200).json({ success: true });
    
  } catch (err: any) {
    console.error('Logout exception:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
