/**
 * supabase-admin.ts
 *
 * Server-side Supabase client using the SERVICE_ROLE_KEY.
 * This client BYPASSES Row Level Security (RLS).
 *
 * IMPORTANT: Only use this in API routes (server-side).
 * Never import this in client components.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * (get it from: Supabase Dashboard → Settings → API → service_role key)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL must be set in environment variables');
}

if (!serviceRoleKey) {
  console.warn(
    '[supabase-admin] SUPABASE_SERVICE_ROLE_KEY not set. ' +
    'API routes will fail to bypass RLS. ' +
    'Get the key from Supabase Dashboard → Settings → API.'
  );
}

/**
 * Server-side Supabase client with service role privileges.
 * Bypasses ALL RLS policies.
 * Use only in API routes and server-side code.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || 'PLACEHOLDER_KEY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
