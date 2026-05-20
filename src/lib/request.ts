export const getClientIp = (headerStore: Pick<Headers, "get">) => {
  const candidates = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "fastly-client-ip",
    "x-appengine-user-ip",
  ];

  for (const headerName of candidates) {
    const rawValue = headerStore.get(headerName);

    if (!rawValue) {
      continue;
    }

    const firstCandidate = rawValue.split(",")[0]?.trim();

    if (!firstCandidate) {
      continue;
    }

    if (firstCandidate.includes(".") && firstCandidate.includes(":")) {
      return firstCandidate.replace(/:\d+$/, "");
    }

    return firstCandidate;
  }

  return null;
};

const normalizeHeaderValue = (value: string | null | undefined) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

export const getApproximateLocation = (headerStore: Pick<Headers, "get">) => {
  const city =
    normalizeHeaderValue(headerStore.get("x-vercel-ip-city")) ??
    normalizeHeaderValue(headerStore.get("x-appengine-city"));
  const region =
    normalizeHeaderValue(headerStore.get("x-vercel-ip-country-region")) ??
    normalizeHeaderValue(headerStore.get("x-appengine-region"));
  const country =
    normalizeHeaderValue(headerStore.get("x-vercel-ip-country")) ??
    normalizeHeaderValue(headerStore.get("x-appengine-country")) ??
    normalizeHeaderValue(headerStore.get("cf-ipcountry"));

  const parts = [city, region, country].filter(Boolean);

  if (parts.length) {
    return parts.join(", ");
  }

  return "Nieznane przyblizone miejsce";
};
