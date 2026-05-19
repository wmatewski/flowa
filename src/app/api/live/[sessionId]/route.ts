import { NextResponse } from "next/server";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getLiveSessionDataForAccess } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
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
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
}
