import "server-only";

import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MembershipRole } from "@/lib/types";

type SessionAccessRow = Pick<Database["flowa"]["Tables"]["sessions"]["Row"], "id" | "name" | "created_by">;

type SessionCollaboratorRow = Pick<
  Database["flowa"]["Tables"]["session_collaborators"]["Row"],
  "session_id" | "membership_id"
>;

type SessionIdListRow = Pick<SessionAccessRow, "id">;

export interface SessionAccessContext {
  organizationId: string;
  membershipId: string;
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
  const [createdSessionsResult, collaboratorSessionsResult] = await Promise.all([
    adminClient
      .from<SessionIdListRow[]>("sessions")
      .select("id")
      .eq("organization_id", context.organizationId)
      .eq("created_by", context.userId),
    adminClient
      .from<SessionCollaboratorRow[]>("session_collaborators")
      .select("session_id, membership_id")
      .eq("membership_id", context.membershipId),
  ]);

  if (createdSessionsResult.error) {
    throw createdSessionsResult.error;
  }

  if (collaboratorSessionsResult.error) {
    throw collaboratorSessionsResult.error;
  }

  const visibleIds = new Set<string>();

  for (const session of createdSessionsResult.data ?? []) {
    visibleIds.add(session.id);
  }

  for (const collaborator of collaboratorSessionsResult.data ?? []) {
    visibleIds.add(collaborator.session_id);
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

  const collaboratorResult = await adminClient
    .from<SessionCollaboratorRow>("session_collaborators")
    .select("session_id, membership_id")
    .eq("session_id", sessionId)
    .eq("membership_id", context.membershipId)
    .maybeSingle();

  if (collaboratorResult.error) {
    throw collaboratorResult.error;
  }

  return collaboratorResult.data ? session : null;
};