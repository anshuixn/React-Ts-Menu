import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use Service Role to bypass RLS for verification
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, password } = req.body;

  try {
    const { data: staff, error } = await supabase
      .from('staff_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !staff || staff.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = Math.random().toString(36).substring(2); // Simple token for now
    res.status(200).json({ 
      success: true, 
      account: { id: staff.id, name: staff.name, role: staff.role }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
