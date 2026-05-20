"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  authorizeLiveDisplayRequest,
  getLiveDisplayRequestById,
  getPendingLiveDisplayRequestByCode,
} from "@/lib/live-display-request";
import { getAccessibleSession, normalizeMembershipRole } from "@/lib/session-access";

const normalizeCode = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);

const ensureSessionAccess = async (sessionId: string) => {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    redirect("/auth?redirect_url=/link");
  }

  if (!orgId) {
    redirect("/link?error=not-authorized");
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

  return { userId, orgId };
};

export const lookupLiveDisplayRequestAction = async (formData: FormData) => {
  const code = normalizeCode(formData.get("code"));

  if (code.length !== 6) {
    redirect("/link?error=missing-code");
  }

  const liveRequest = await getPendingLiveDisplayRequestByCode(code);

  if (!liveRequest) {
    redirect("/link?error=invalid-code");
  }

  await ensureSessionAccess(liveRequest.session_id);
  redirect(`/link?request=${liveRequest.id}`);
};

export const authorizeLiveDisplayRequestAction = async (formData: FormData) => {
  const requestId = String(formData.get("requestId") ?? "").trim();

  if (!requestId) {
    redirect("/link?error=invalid-request");
  }

  const liveRequest = await getLiveDisplayRequestById(requestId);

  if (!liveRequest || liveRequest.status !== "pending") {
    redirect("/link?error=invalid-request");
  }

  const { userId } = await ensureSessionAccess(liveRequest.session_id);
  const authorizedRequest = await authorizeLiveDisplayRequest(requestId, userId);

  if (!authorizedRequest) {
    redirect("/link?error=invalid-request");
  }

  redirect(`/live/${liveRequest.session_id}?request=${authorizedRequest.id}`);
};
