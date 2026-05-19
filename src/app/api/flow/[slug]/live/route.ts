import { NextResponse } from "next/server";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getLiveSessionDataForAccess } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { organization, membership, user } = await getAuthenticatedAdmin();
    const adminClient = createSupabaseAdminClient();
    const { data: session } = await adminClient
      .from<{ id: string }>("sessions")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!session?.id) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    const data = await getLiveSessionDataForAccess(
      {
        organizationId: organization.id,
        membershipId: membership.id,
        role: membership.role,
        userId: user.id,
      },
      session.id,
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