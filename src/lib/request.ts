export const getClientIp = (headerStore: Headers) => {
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