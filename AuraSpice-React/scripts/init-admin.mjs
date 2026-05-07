import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const adminId = requireEnv('BOOTSTRAP_ADMIN_ID');
  const adminName = requireEnv('BOOTSTRAP_ADMIN_NAME');
  const adminPassword = requireEnv('BOOTSTRAP_ADMIN_PASSWORD');
  const establishmentKey = requireEnv('BOOTSTRAP_ESTABLISHMENT_KEY');

  if (adminPassword.length < 8) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters long');
  }

  if (establishmentKey.length < 12) {
    throw new Error('BOOTSTRAP_ESTABLISHMENT_KEY must be at least 12 characters long');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const { error: keyError } = await supabaseAdmin.from('settings').upsert({
    key: 'establishment_key',
    value: establishmentKey,
    updated_at: new Date().toISOString(),
  });

  if (keyError) {
    throw new Error(`Unable to upsert establishment key: ${keyError.message}`);
  }

  const { error: adminError } = await supabaseAdmin.from('staff_accounts').upsert({
    id: adminId,
    name: adminName,
    role: 'Admin',
    password_hash: passwordHash,
  });

  if (adminError) {
    throw new Error(`Unable to create bootstrap admin: ${adminError.message}`);
  }

  process.stdout.write(
    `Bootstrap admin "${adminId}" created or updated successfully. Rotate BOOTSTRAP_ADMIN_PASSWORD after first login.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Unknown bootstrap error'}\n`);
  process.exit(1);
});
