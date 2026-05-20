import { NextResponse } from "next/server";

import {
  expireStaleLiveDisplayRequests,
  getLiveDisplayRequestById,
} from "@/lib/live-display-request";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;

  await expireStaleLiveDisplayRequests();

  const liveRequest = await getLiveDisplayRequestById(requestId);

  if (!liveRequest || liveRequest.status === "expired" || liveRequest.status === "revoked") {
    return NextResponse.json({ error: "missing-request" }, { status: 404 });
  }

  return NextResponse.json({
    requestId: liveRequest.id,
    authorizationCode: liveRequest.authorization_code,
    status: liveRequest.status === "authorized" ? "authorized" : "pending",
  });
}
