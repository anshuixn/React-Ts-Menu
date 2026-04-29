import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('staff_accounts')
        .select('id, name, role, registered_at');

      if (error) throw error;
      // Map keys to match previous frontend expectations if necessary
      const formatted = data.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        registeredAt: s.registered_at
      }));
      res.status(200).json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'POST') {
    const { account, key } = req.body;
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'establishment_key')
        .single();

      if (!settings || key !== settings.value) {
        return res.status(403).json({ success: false, message: 'Invalid Establishment Key' });
      }

      const { error } = await supabase
        .from('staff_accounts')
        .insert({
          id: account.id,
          name: account.name,
          password: account.password,
          role: account.role || 'Staff',
          registered_at: new Date().toISOString()
        });

      if (error) return res.status(409).json({ success: false, message: 'Staff ID already taken' });
      res.status(201).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
