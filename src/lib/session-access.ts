import "server-only";

import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MembershipRole } from "@/lib/types";

type SessionAccessRow = Pick<Database["public"]["Tables"]["sessions"]["Row"], "id" | "name" | "created_by">;

type SessionIdListRow = Pick<SessionAccessRow, "id">;

export interface SessionAccessContext {
  organizationId: string;
  membershipId?: string;
  role: MembershipRole;
  userId: string;
}

export const canManageAllSessions = (role: MembershipRole) =>
  role === "owner" || role === "admin";

export const getVisibleSessionIds = async (
  context: SessionAccessContext,
): Promise<string[] | null> => {
  if (canManageAllSessions(context.role)) {
    return null;
  }

  const adminClient = createSupabaseAdminClient();
  const createdSessionsResult = await adminClient
    .from<SessionIdListRow[]>("sessions")
    .select("id")
    .eq("organization_id", context.organizationId)
    .eq("created_by", context.userId);

  if (createdSessionsResult.error) {
    throw createdSessionsResult.error;
  }

  const visibleIds = new Set<string>();

  for (const session of createdSessionsResult.data ?? []) {
    visibleIds.add(session.id);
  }

  return [...visibleIds];
};

export const getAccessibleSession = async (
  context: SessionAccessContext,
  sessionId: string,
): Promise<SessionAccessRow | null> => {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from<SessionAccessRow>("sessions")
    .select("id, name, created_by")
    .eq("id", sessionId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const session = data ?? null;

  if (!session) {
    return null;
  }

  if (canManageAllSessions(context.role) || session.created_by === context.userId) {
    return session;
  }

  return null;
};