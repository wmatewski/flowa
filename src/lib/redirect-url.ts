export const sanitizeInternalRedirectUrl = (value: string | null | undefined, fallback = "/admin") => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return fallback;
  }

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  return normalized;
};
