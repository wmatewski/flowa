import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  createLiveDisplayRequest,
  expireStaleLiveDisplayRequests,
  getActiveLiveDisplayRequestForViewer,
  touchLiveDisplayRequest,
} from "@/lib/live-display-request";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, getOperatingSystemConfig } from "@/lib/os";
import { getApproximateLocation, getClientIp } from "@/lib/request";
import { createSessionId, sessionCookieOptions } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const cookieStore = await cookies();
  const headerStore = await headers();
  let viewerKey = cookieStore.get(publicEnv.sessionCookieName)?.value ?? null;

  if (!viewerKey) {
    viewerKey = createSessionId();
    cookieStore.set(publicEnv.sessionCookieName, viewerKey, sessionCookieOptions);
  }

  await expireStaleLiveDisplayRequests();

  let liveRequest = await getActiveLiveDisplayRequestForViewer(sessionId, viewerKey);

  if (!liveRequest) {
    const userAgent = headerStore.get("user-agent");
    const detectedOperatingSystem = detectOperatingSystem(userAgent);
    liveRequest = await createLiveDisplayRequest({
      sessionId,
      viewerKey,
      deviceLabel: getOperatingSystemConfig(detectedOperatingSystem).shortLabel,
      requestedIp: getClientIp(headerStore),
      approximateLocation: getApproximateLocation(headerStore),
      requestUserAgent: userAgent,
    });
  } else {
    await touchLiveDisplayRequest(liveRequest.id);
  }

  return NextResponse.json({
    requestId: liveRequest.id,
    authorizationCode: liveRequest.authorization_code,
    status: liveRequest.status === "authorized" ? "authorized" : "pending",
  });
}
