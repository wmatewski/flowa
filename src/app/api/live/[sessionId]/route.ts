import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getLiveSessionDataById, getLiveSessionDataForAccess } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { getAuthorizedLiveDisplayRequestForViewer, getLiveDisplayRequestById } from "@/lib/live-display-request";
import { getAccessibleSession, normalizeMembershipRole } from "@/lib/session-access";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const url = new URL(request.url);
    const requestId = url.searchParams.get("request");
    const { userId, orgId, orgRole } = await auth();

    if (userId && orgId) {
      const accessibleSession = await getAccessibleSession(
        {
          organizationId: orgId,
          role: normalizeMembershipRole(orgRole),
          userId,
        },
        sessionId,
      );

      if (accessibleSession) {
        const { organization, membership, user } = await getAuthenticatedAdmin();
        const data = await getLiveSessionDataForAccess(
          {
            organizationId: organization.id,
            membershipId: membership.id,
            role: membership.role,
            userId: user.id,
          },
          sessionId,
        );

        return NextResponse.json({
          participantCount: data.overview?.participant_count ?? data.entries.length,
          averageMinutes: data.overview?.average_minutes ?? null,
          entries: data.entries,
        });
      }
    }

    if (requestId) {
      const liveRequest = await getLiveDisplayRequestById(requestId);

      if (!liveRequest || liveRequest.session_id !== sessionId || liveRequest.status !== "authorized") {
        return NextResponse.json({ error: "not-found" }, { status: 404 });
      }

      const data = await getLiveSessionDataById(sessionId);

      return NextResponse.json({
        participantCount: data.overview?.participant_count ?? data.entries.length,
        averageMinutes: data.overview?.average_minutes ?? null,
        entries: data.entries,
      });
    }

    const cookieStore = await cookies();
    const viewerKey = cookieStore.get(publicEnv.sessionCookieName)?.value ?? null;

    if (!viewerKey) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const authorizedRequest = await getAuthorizedLiveDisplayRequestForViewer(sessionId, viewerKey);

    if (!authorizedRequest) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const data = await getLiveSessionDataById(sessionId);

    return NextResponse.json({
      participantCount: data.overview?.participant_count ?? data.entries.length,
      averageMinutes: data.overview?.average_minutes ?? null,
      entries: data.entries,
    });
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
}
