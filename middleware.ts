import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createSessionId, sessionCookieOptions } from "@/lib/session";

const sessionCookieName = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? "flowa_session_id";

export default clerkMiddleware(async (_auth, request) => {
  const response = NextResponse.next();

  if (!request.cookies.get(sessionCookieName)?.value) {
    response.cookies.set(sessionCookieName, createSessionId(), sessionCookieOptions);
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};