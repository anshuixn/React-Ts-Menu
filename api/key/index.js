import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'establishment_key')
        .single();

      if (error) throw error;
      res.status(200).json({ key: data.value });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'POST') {
    const { key } = req.body;
    try {
      const { error } = await supabase
        .from('settings')
        .update({ value: key })
        .eq('key', 'establishment_key');

      if (error) throw error;
      res.status(200).json({ key });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
