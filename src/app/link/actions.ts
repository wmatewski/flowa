"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createLiveDisplayToken } from "@/lib/live-display-session";
import { getClientIp } from "@/lib/request";
import { detectOperatingSystem, getOperatingSystemConfig } from "@/lib/os";
import { findSessionIdByShortCode, getSessionById } from "@/lib/public-session";
import { getAccessibleSession, normalizeMembershipRole } from "@/lib/session-access";

export const pairLiveDisplayAction = async (formData: FormData) => {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    redirect("/auth?redirect_url=/link");
  }

  if (!orgId) {
    redirect("/link?error=not-authorized");
  }

  const code = String(formData.get("code") ?? "").trim().toLowerCase();

  if (!code) {
    redirect("/link?error=missing-code");
  }

  const sessionId = (await findSessionIdByShortCode(code)) ?? null;

  if (!sessionId) {
    redirect("/link?error=invalid-code");
  }

  const accessibleSession = await getAccessibleSession(
    {
      organizationId: orgId,
      role: normalizeMembershipRole(orgRole),
      userId,
    },
    sessionId,
  );

  if (!accessibleSession) {
    redirect("/link?error=forbidden");
  }

  const session = await getSessionById(sessionId);

  if (!session) {
    redirect("/link?error=invalid-code");
  }

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const operatingSystem = detectOperatingSystem(userAgent);
  const deviceLabel = getOperatingSystemConfig(operatingSystem).shortLabel;
  const displayToken = createLiveDisplayToken({
    sessionId: session.id,
    organizationId: session.organization_id,
    userId,
    deviceLabel,
    ipAddress: getClientIp(headerStore),
    userAgent,
  });

  const query = new URLSearchParams();
  query.set("sessionId", session.id);
  query.set("display_token", displayToken);
  query.set("paired", "1");

  redirect(`/link?${query.toString()}`);
};
