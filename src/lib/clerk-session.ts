type SessionClaimsLike = Record<string, unknown> | null | undefined;

const ORGANIZATION_ID_PATTERN = /^org_[a-zA-Z0-9_-]+$/;

const addOrganizationId = (target: Set<string>, value: unknown) => {
  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim();

  if (!normalized) {
    return;
  }

  target.add(normalized);
};

const collectOrganizationIds = (target: Set<string>, value: unknown) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectOrganizationIds(target, item));
    return;
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (!normalized) {
      return;
    }

    if (
      (normalized.startsWith("[") && normalized.endsWith("]")) ||
      (normalized.startsWith("{") && normalized.endsWith("}"))
    ) {
      try {
        collectOrganizationIds(target, JSON.parse(normalized));
        return;
      } catch {
        // Ignore malformed JSON-like strings and fall back to plain text parsing.
      }
    }

    normalized
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        if (ORGANIZATION_ID_PATTERN.test(item)) {
          target.add(item);
        }
      });

    if (ORGANIZATION_ID_PATTERN.test(normalized)) {
      target.add(normalized);
    }

    return;
  }

  if (typeof value !== "object" || value == null) {
    return;
  }

  const record = value as Record<string, unknown>;

  addOrganizationId(target, record.id);
  addOrganizationId(target, record.orgId);
  addOrganizationId(target, record.org_id);
  addOrganizationId(target, record.organizationId);
  addOrganizationId(target, record.organization_id);

  Object.keys(record)
    .filter((key) => ORGANIZATION_ID_PATTERN.test(key))
    .forEach((key) => target.add(key));
};

const readBooleanClaim = (value: unknown): boolean | null => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "verified"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "unverified"].includes(normalized)) {
    return false;
  }

  return null;
};

export const getSessionOrganizationIds = (
  sessionClaims: SessionClaimsLike,
  fallbackOrgId?: string | null,
) => {
  const organizationIds = new Set<string>();

  if (sessionClaims) {
    collectOrganizationIds(organizationIds, sessionClaims.organizations);
  }

  if (fallbackOrgId) {
    organizationIds.add(fallbackOrgId);
  }

  return [...organizationIds];
};

export const getSessionVerificationClaim = (sessionClaims: SessionClaimsLike) => {
  if (!sessionClaims) {
    return null;
  }

  return (
    readBooleanClaim(sessionClaims.user_verify) ??
    readBooleanClaim(sessionClaims.userVerify) ??
    readBooleanClaim(sessionClaims.email_verified) ??
    readBooleanClaim(sessionClaims.emailVerified)
  );
};