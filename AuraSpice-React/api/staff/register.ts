import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { account, key } = req.body;

  if (!account || !key) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // 1. Verify the Establishment Key matches the one in DB
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'establishment_key')
      .single();

    if (settingsError || !settingsData || settingsData.value !== key) {
      return res.status(401).json({ success: false, message: 'Invalid Establishment Key' });
    }

    // 2. Hash the password before saving
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(account.password, saltRounds);

    // 3. Insert new staff account into Supabase
    const { error: insertError } = await supabaseAdmin
      .from('staff_accounts')
      .insert({
        id: account.id,
        name: account.name,
        role: account.role || 'Staff',
        password_hash: passwordHash,
      });

    if (insertError) {
      // Check for unique constraint violation (code 23505 in Postgres)
      if (insertError.code === '23505') {
        return res.status(409).json({ success: false, message: 'Staff ID already exists' });
      }
      console.error('Registration insert error:', insertError);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }

    return res.status(200).json({ success: true, message: 'Registration successful' });
    
  } catch (err: any) {
    console.error('Registration exception:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
