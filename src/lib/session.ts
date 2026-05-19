export const createSessionId = () => crypto.randomUUID();

const sessionCookieName = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? "flowa_session_id";

const normalizeCookieDomain = (value: string) => {
  const trimmed = value.trim().replace(/^\.+/, "");

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.trim().toLowerCase();

    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return "";
    }

    return hostname;
  } catch {
    return "";
  }
};

const projectDomain = normalizeCookieDomain(process.env.NEXT_PUBLIC_PROJECT_DOMAIN ?? "");

const baseCookieOptions = {
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  ...(projectDomain ? { domain: projectDomain } : {}),
};

export const sessionCookieOptions = {
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 365,
};

export const supabaseAuthCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 24 * 365,
};

export { sessionCookieName };
