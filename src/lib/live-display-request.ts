import "server-only";

import { randomInt } from "crypto";

import { getNeonPool } from "@/lib/neon";

export type LiveDisplayRequestStatus = "pending" | "authorized" | "revoked" | "expired";

export interface LiveDisplayRequestRow {
  id: string;
  session_id: string;
  viewer_key: string;
  authorization_code: string;
  status: LiveDisplayRequestStatus;
  device_label: string | null;
  requested_ip: string | null;
  approximate_location: string | null;
  request_user_agent: string | null;
  requested_at: string;
  last_seen_at: string;
  authorized_at: string | null;
  authorized_by_user_id: string | null;
  expires_at: string;
}

const ACTIVE_REQUEST_STATUSES: LiveDisplayRequestStatus[] = ["pending", "authorized"];
const PENDING_TTL_HOURS = 12;
const AUTHORIZED_TTL_HOURS = 24;

const mapRow = (row: Record<string, unknown>): LiveDisplayRequestRow => ({
  id: String(row.id),
  session_id: String(row.session_id),
  viewer_key: String(row.viewer_key),
  authorization_code: String(row.authorization_code),
  status: String(row.status) as LiveDisplayRequestStatus,
  device_label: row.device_label ? String(row.device_label) : null,
  requested_ip: row.requested_ip ? String(row.requested_ip) : null,
  approximate_location: row.approximate_location ? String(row.approximate_location) : null,
  request_user_agent: row.request_user_agent ? String(row.request_user_agent) : null,
  requested_at: String(row.requested_at),
  last_seen_at: String(row.last_seen_at),
  authorized_at: row.authorized_at ? String(row.authorized_at) : null,
  authorized_by_user_id: row.authorized_by_user_id ? String(row.authorized_by_user_id) : null,
  expires_at: String(row.expires_at),
});

const generateAuthorizationCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export const expireStaleLiveDisplayRequests = async () => {
  const pool = getNeonPool();

  await pool.query(
    `UPDATE public.live_display_requests
     SET status = 'expired'
     WHERE status = 'pending'
       AND expires_at < timezone('utc', now())`,
  );
};

export const getActiveLiveDisplayRequestForViewer = async (
  sessionId: string,
  viewerKey: string,
): Promise<LiveDisplayRequestRow | null> => {
  const pool = getNeonPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT id, session_id, viewer_key, authorization_code, status, device_label, requested_ip,
            approximate_location, request_user_agent, requested_at, last_seen_at, authorized_at,
            authorized_by_user_id, expires_at
     FROM public.live_display_requests
     WHERE session_id = $1
       AND viewer_key = $2
       AND status = ANY ($3::text[])
       AND expires_at >= timezone('utc', now())
     ORDER BY requested_at DESC
     LIMIT 1`,
    [sessionId, viewerKey, ACTIVE_REQUEST_STATUSES],
  );

  return rows[0] ? mapRow(rows[0]) : null;
};

export const getAuthorizedLiveDisplayRequestForViewer = async (
  sessionId: string,
  viewerKey: string,
): Promise<LiveDisplayRequestRow | null> => {
  const pool = getNeonPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT id, session_id, viewer_key, authorization_code, status, device_label, requested_ip,
            approximate_location, request_user_agent, requested_at, last_seen_at, authorized_at,
            authorized_by_user_id, expires_at
     FROM public.live_display_requests
     WHERE session_id = $1
       AND viewer_key = $2
       AND status = 'authorized'
       AND expires_at >= timezone('utc', now())
     ORDER BY authorized_at DESC NULLS LAST, requested_at DESC
     LIMIT 1`,
    [sessionId, viewerKey],
  );

  return rows[0] ? mapRow(rows[0]) : null;
};

export const getLiveDisplayRequestById = async (
  requestId: string,
): Promise<LiveDisplayRequestRow | null> => {
  const pool = getNeonPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT id, session_id, viewer_key, authorization_code, status, device_label, requested_ip,
            approximate_location, request_user_agent, requested_at, last_seen_at, authorized_at,
            authorized_by_user_id, expires_at
     FROM public.live_display_requests
     WHERE id = $1
     LIMIT 1`,
    [requestId],
  );

  return rows[0] ? mapRow(rows[0]) : null;
};

export const getPendingLiveDisplayRequestByCode = async (
  authorizationCode: string,
): Promise<LiveDisplayRequestRow | null> => {
  const pool = getNeonPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `SELECT id, session_id, viewer_key, authorization_code, status, device_label, requested_ip,
            approximate_location, request_user_agent, requested_at, last_seen_at, authorized_at,
            authorized_by_user_id, expires_at
     FROM public.live_display_requests
     WHERE authorization_code = $1
       AND status = 'pending'
       AND expires_at >= timezone('utc', now())
     ORDER BY requested_at DESC
     LIMIT 1`,
    [authorizationCode],
  );

  return rows[0] ? mapRow(rows[0]) : null;
};

export const touchLiveDisplayRequest = async (requestId: string) => {
  const pool = getNeonPool();

  await pool.query(
    `UPDATE public.live_display_requests
     SET last_seen_at = timezone('utc', now())
     WHERE id = $1`,
    [requestId],
  );
};

const ensureUniqueAuthorizationCode = async () => {
  const pool = getNeonPool();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = generateAuthorizationCode();
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id
       FROM public.live_display_requests
       WHERE authorization_code = $1
         AND status = 'pending'
         AND expires_at >= timezone('utc', now())
       LIMIT 1`,
      [code],
    );

    if (!rows.length) {
      return code;
    }
  }

  return generateAuthorizationCode();
};

export const createLiveDisplayRequest = async (input: {
  sessionId: string;
  viewerKey: string;
  deviceLabel: string | null;
  requestedIp: string | null;
  approximateLocation: string | null;
  requestUserAgent: string | null;
}): Promise<LiveDisplayRequestRow> => {
  const pool = getNeonPool();
  const authorizationCode = await ensureUniqueAuthorizationCode();
  const { rows } = await pool.query<Record<string, unknown>>(
    `INSERT INTO public.live_display_requests (
       session_id,
       viewer_key,
       authorization_code,
       status,
       device_label,
       requested_ip,
       approximate_location,
       request_user_agent,
       requested_at,
       last_seen_at,
       expires_at
     )
     VALUES (
       $1,
       $2,
       $3,
       'pending',
       $4,
       $5::inet,
       $6,
       $7,
       timezone('utc', now()),
       timezone('utc', now()),
       timezone('utc', now()) + ($8 || ' hours')::interval
     )
     RETURNING id, session_id, viewer_key, authorization_code, status, device_label, requested_ip,
               approximate_location, request_user_agent, requested_at, last_seen_at, authorized_at,
               authorized_by_user_id, expires_at`,
    [
      input.sessionId,
      input.viewerKey,
      authorizationCode,
      input.deviceLabel,
      input.requestedIp,
      input.approximateLocation,
      input.requestUserAgent,
      String(PENDING_TTL_HOURS),
    ],
  );

  if (!rows[0]) {
    throw new Error("Failed to create live display request.");
  }

  return mapRow(rows[0]);
};

export const authorizeLiveDisplayRequest = async (
  requestId: string,
  userId: string,
): Promise<LiveDisplayRequestRow | null> => {
  const pool = getNeonPool();
  const { rows } = await pool.query<Record<string, unknown>>(
    `UPDATE public.live_display_requests
     SET status = 'authorized',
         authorized_at = timezone('utc', now()),
         authorized_by_user_id = $2,
         expires_at = timezone('utc', now()) + ($3 || ' hours')::interval
     WHERE id = $1
       AND status = 'pending'
       AND expires_at >= timezone('utc', now())
     RETURNING id, session_id, viewer_key, authorization_code, status, device_label, requested_ip,
               approximate_location, request_user_agent, requested_at, last_seen_at, authorized_at,
               authorized_by_user_id, expires_at`,
    [requestId, userId, String(AUTHORIZED_TTL_HOURS)],
  );

  return rows[0] ? mapRow(rows[0]) : null;
};
