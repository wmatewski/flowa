import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  expireStaleLiveDisplayRequests,
  getActiveLiveDisplayRequestForViewer,
} from "@/lib/live-display-request";
import { publicEnv } from "@/lib/env/public";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const viewerKey = cookieStore.get(publicEnv.sessionCookieName)?.value ?? null;

  if (!viewerKey) {
    return NextResponse.json({ error: "missing-viewer" }, { status: 404 });
  }

  await expireStaleLiveDisplayRequests();

  const liveRequest = await getActiveLiveDisplayRequestForViewer(sessionId, viewerKey);

  if (!liveRequest) {
    return NextResponse.json({ error: "missing-request" }, { status: 404 });
  }

  return NextResponse.json({
    requestId: liveRequest.id,
    authorizationCode: liveRequest.authorization_code,
    status: liveRequest.status === "authorized" ? "authorized" : "pending",
  });
}
