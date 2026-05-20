import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { getLiveSessionSecret } from "@/lib/env/server";

const LIVE_DISPLAY_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export interface LiveDisplaySessionTokenPayload {
  sessionId: string;
  organizationId: string;
  userId: string;
  deviceLabel: string;
  ipAddress: string | null;
  userAgent: string | null;
  issuedAt: string;
  expiresAt: string;
}

const encodeBase64Url = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

export const createLiveDisplayToken = (
  payload: Omit<LiveDisplaySessionTokenPayload, "issuedAt" | "expiresAt"> & {
    ttlMs?: number;
  },
) => {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + (payload.ttlMs ?? LIVE_DISPLAY_TOKEN_TTL_MS));
  const tokenPayload: LiveDisplaySessionTokenPayload = {
    sessionId: payload.sessionId,
    organizationId: payload.organizationId,
    userId: payload.userId,
    deviceLabel: payload.deviceLabel,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(tokenPayload));
  const signature = createHmac("sha256", getLiveSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const verifyLiveDisplayToken = (token: string) => {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  let payload: LiveDisplaySessionTokenPayload;

  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload)) as LiveDisplaySessionTokenPayload;
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.sessionId !== "string" ||
    typeof payload.organizationId !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.deviceLabel !== "string" ||
    typeof payload.issuedAt !== "string" ||
    typeof payload.expiresAt !== "string"
  ) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getLiveSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  if (expectedSignature.length !== signature.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    return null;
  }

  const expiresAt = new Date(payload.expiresAt);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return null;
  }

  return payload;
};

export const buildLiveDisplayUrl = (baseUrl: string, sessionId: string, token: string) => {
  const url = new URL(`/live/${sessionId}`, baseUrl.replace(/\/$/, ""));
  url.searchParams.set("embed", "1");
  url.searchParams.set("display_token", token);
  return url.toString();
};

export const buildLiveDisplayPreviewUrl = (baseUrl: string, sessionId: string, token: string) =>
  buildLiveDisplayUrl(baseUrl, sessionId, token);
