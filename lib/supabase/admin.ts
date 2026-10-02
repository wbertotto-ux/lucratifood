import { createClient } from "@supabase/supabase-js";

// Bypasses RLS — use only in server-side trusted contexts (webhooks, cron jobs)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
