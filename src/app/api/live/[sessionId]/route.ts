import { NextResponse } from "next/server";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getLiveSessionDataById, getLiveSessionDataForAccess } from "@/lib/data";
import { resolveLiveSessionAccess } from "@/lib/live-session-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const url = new URL(_request.url);
    const displayToken = url.searchParams.get("display_token");
    const access = await resolveLiveSessionAccess(sessionId, displayToken);

    if (!access) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const data =
      access.source === "display"
        ? await getLiveSessionDataById(sessionId)
        : await (async () => {
            const { organization, membership, user } = await getAuthenticatedAdmin();
            return getLiveSessionDataForAccess(
              {
                organizationId: organization.id,
                membershipId: membership.id,
                role: membership.role,
                userId: user.id,
              },
              sessionId,
            );
          })();

    return NextResponse.json({
      participantCount: data.overview?.participant_count ?? data.entries.length,
      averageMinutes: data.overview?.average_minutes ?? null,
      entries: data.entries,
    });
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
}
