import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getClerkOrganizationSummary } from "@/lib/clerk-organizations";
import { getSessionVerificationClaim } from "@/lib/clerk-session";
import type { Membership, Organization, OrganizationMember } from "@/lib/types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface EmailVerificationStatus {
  daysRemaining: number;
  expiresAt: string;
  isExpired: boolean;
}

const EMAIL_VERIFICATION_GRACE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (value: string | null | undefined) =>
  String(value ?? "").trim().toLowerCase();

const toIsoString = (value: unknown) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date(0).toISOString() : value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date(0).toISOString();
};

const mapOrganizationRole = (role: string | null | undefined): Membership["role"] => {
  const normalized = String(role ?? "").toLowerCase();

  if (normalized.includes("owner")) {
    return "owner";
  }

  if (normalized.includes("admin")) {
    return "admin";
  }

  return "moderator";
};

const deriveDisplayName = (user: AuthenticatedUser) => {
  const fullName = user.displayName;

  if (fullName?.trim()) {
    return fullName.trim();
  }

  return normalizeEmail(user.email).split("@")[0] ?? "Organizator";
};

export const getEmailVerificationStatus = (user: Pick<AuthenticatedUser, "createdAt" | "emailVerified">) => {
  if (user.emailVerified) {
    return null;
  }

  const createdAtTimestamp = new Date(user.createdAt).getTime();

  if (Number.isNaN(createdAtTimestamp)) {
    return {
      daysRemaining: EMAIL_VERIFICATION_GRACE_DAYS,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_GRACE_DAYS * DAY_MS).toISOString(),
      isExpired: false,
    } satisfies EmailVerificationStatus;
  }

  const expiresAtTimestamp = createdAtTimestamp + EMAIL_VERIFICATION_GRACE_DAYS * DAY_MS;
  const msRemaining = expiresAtTimestamp - Date.now();

  return {
    daysRemaining: Math.max(0, Math.ceil(msRemaining / DAY_MS)),
    expiresAt: new Date(expiresAtTimestamp).toISOString(),
    isExpired: msRemaining <= 0,
  } satisfies EmailVerificationStatus;
};

export const getAuthenticatedUser = async (): Promise<AuthenticatedUser> => {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/auth");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const primaryAddress =
    user.primaryEmailAddressId == null
      ? user.emailAddresses[0]
      : user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId) ??
        user.emailAddresses[0];
  const email = normalizeEmail(primaryAddress?.emailAddress);
  const verificationClaim = getSessionVerificationClaim(
    sessionClaims as Record<string, unknown> | null | undefined,
  );

  if (!email) {
    throw new Error("Authenticated Clerk user is missing an e-mail address.");
  }

  return {
    id: user.id,
    email,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" "),
    createdAt: toIsoString((user as { createdAt?: Date | string | number }).createdAt ?? Date.now()),
    emailVerified: verificationClaim ?? String(primaryAddress?.verification?.status ?? "") === "verified",
  };
};

export const getAuthenticatedAdmin = async (): Promise<{
  user: AuthenticatedUser;
  organization: Organization;
  membership: Membership;
  memberships: Membership[];
}> => {
  const { orgId, orgRole, sessionClaims, userId } = await auth();
  const user = await getAuthenticatedUser();
  const verificationStatus = getEmailVerificationStatus(user);

  if (verificationStatus?.isExpired) {
    redirect("/auth?error=email-verification-expired");
  }

  if (!orgId) {
    redirect("/auth");
  }

  const clerk = await clerkClient();
  const organization = await getClerkOrganizationSummary(orgId);
  const membershipList = await clerk.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });
  const currentMembership = (membershipList.data ?? []).find((item: any) => {
    const memberUserId = String(item.publicUserData?.userId ?? item.publicUserData?.id ?? "");
    return memberUserId === userId;
  }) as any;

  if (!currentMembership) {
    redirect("/auth?error=not-authorized");
  }

  const currentRole = mapOrganizationRole(orgRole ?? currentMembership.role);
  const memberships = (membershipList.data ?? []).map((item: any) => {
    const publicUserData = item.publicUserData ?? {};
    const email = normalizeEmail(
      publicUserData.identifier ??
        publicUserData.emailAddress ??
        publicUserData.primaryEmailAddress?.emailAddress ??
        publicUserData.emailAddresses?.[0]?.emailAddress,
    );
    const displayName =
      [publicUserData.firstName, publicUserData.lastName].filter(Boolean).join(" ").trim() ||
      email.split("@")[0] ||
      email ||
      "Organizator";

    const organizationMember: OrganizationMember = {
      id: item.id,
      membershipId: item.id,
      userId: String(publicUserData.userId ?? publicUserData.id ?? "").trim(),
      email,
      displayName,
      initials: displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "WF",
      role: mapOrganizationRole(item.role),
      status: "active",
      createdAt: toIsoString((item as { createdAt?: unknown }).createdAt ?? Date.now()),
    };

    return organizationMember as Membership;
  });

  const membership =
    memberships.find((item) => item.userId === user.id) ??
    ({
      id: currentMembership.id,
      membershipId: currentMembership.id,
      organizationId: organization.id,
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      initials: user.displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "WF",
      role: currentRole,
      status: "active",
      createdAt: user.createdAt,
    } satisfies Membership);

  if (!memberships.length) {
    memberships.push(membership);
  }

  return { user, organization, membership, memberships };
};