import "server-only";

import { auth } from "@clerk/nextjs/server";

import { verifyLiveDisplayToken, type LiveDisplaySessionTokenPayload } from "@/lib/live-display-session";
import { getAccessibleSession, normalizeMembershipRole } from "@/lib/session-access";

export interface LiveSessionAccessResult {
  source: "admin" | "display";
  tokenPayload?: LiveDisplaySessionTokenPayload;
}

const resolveAdminLiveAccess = async (sessionId: string): Promise<boolean> => {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return false;
  }

  const accessibleSession = await getAccessibleSession(
    {
      organizationId: orgId,
      role: normalizeMembershipRole(orgRole),
      userId,
    },
    sessionId,
  );

  return Boolean(accessibleSession);
};

export const resolveLiveSessionAccess = async (
  sessionId: string,
  token?: string | null,
): Promise<LiveSessionAccessResult | null> => {
  const tokenPayload = token ? verifyLiveDisplayToken(token) : null;

  if (tokenPayload?.sessionId === sessionId) {
    return {
      source: "display",
      tokenPayload,
    };
  }

  const isAdminAuthorized = await resolveAdminLiveAccess(sessionId);

  if (isAdminAuthorized) {
    return {
      source: "admin",
    };
  }

  return null;
};
