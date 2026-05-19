import "server-only";

import { getNeonPool } from "@/lib/neon";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Session } from "@/lib/types";
export { buildSessionPublicUrl, buildSessionShortCode, buildSessionShortPath } from "@/lib/public-session-url";

export const findSessionIdByPrefix = async (prefix: string) => {
  const code = prefix.trim().toLowerCase();

  if (!code) {
    return null;
  }

  const pool = getNeonPool();
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id
     FROM public.sessions
     WHERE id::text ILIKE $1
     ORDER BY created_at DESC
     LIMIT 2`,
    [`${code}%`],
  );

  return rows[0]?.id ?? null;
};

export const findSessionIdBySlug = async (slug: string) => {
  const value = slug.trim();

  if (!value) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from<Pick<Session, "id">>("sessions")
    .select("id")
    .eq("slug", value)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as { id?: string } | null)?.id ?? null;
};

export const getSessionById = async (sessionId: string) => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from<Session>("sessions")
    .select(
      "id, organization_id, slug, name, description, screen_time_limit_minutes, age_mode, fixed_age, age_recommendations_enabled, age_recommendations, status, created_by, starts_at, ends_at, created_at, updated_at",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Session | null) ?? null;
};
