import { NextResponse } from "next/server";

import { getPublicLiveSessionData } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const data = await getPublicLiveSessionData(slug);

    return NextResponse.json({
      participantCount: data.overview?.participant_count ?? data.entries.length,
      averageMinutes: data.overview?.average_minutes ?? null,
      entries: data.entries,
    });
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
}