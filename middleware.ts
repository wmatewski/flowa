import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { publicEnv } from "@/lib/env/public";
import { createSessionId, sessionCookieOptions } from "@/lib/session";

export default clerkMiddleware(async (_auth, request) => {
  const response = NextResponse.next();

  if (!request.cookies.get(publicEnv.sessionCookieName)?.value) {
    response.cookies.set(publicEnv.sessionCookieName, createSessionId(), sessionCookieOptions);
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};