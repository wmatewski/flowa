export const buildSessionShortCode = (sessionId: string) =>
  sessionId.replace(/-/g, "").slice(0, 5).toLowerCase();

export const buildSessionShortPath = (sessionId: string) => `/${buildSessionShortCode(sessionId)}`;

export const buildSessionPublicUrl = (baseUrl: string, sessionId: string) =>
  `${baseUrl.replace(/\/$/, "")}${buildSessionShortPath(sessionId)}`;
