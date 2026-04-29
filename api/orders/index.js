import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .neq('id', '0'); // Delete all

      if (error) throw error;
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
