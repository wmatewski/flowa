import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getSessionVerificationClaim } from "@/lib/clerk-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

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

const buildOrganizationSlug = (source: string) => {
  const baseSlug = slugify(source) || "organization-flowa";
  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
};

const getAuthenticatedUser = async (): Promise<{
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
  emailVerified: boolean;
  orgId: string | null;
} | null> => {
  const { userId, orgId, sessionClaims } = await auth();

  if (!userId) {
    return null;
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
    return null;
  }

  return {
    userId: user.id,
    email,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" "),
    createdAt: toIsoString((user as { createdAt?: Date | string | number }).createdAt ?? Date.now()),
    emailVerified: verificationClaim ?? String(primaryAddress?.verification?.status ?? "") === "verified",
    orgId: orgId ?? null,
  };
};

export async function POST(request: Request) {
  const authState = await getAuthenticatedUser();

  if (!authState) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { userId, email, displayName, orgId } = authState;

  const payload = await request
    .json()
    .catch(() => ({}) as { organizationName?: string | null });
  const organizationName = String(payload.organizationName ?? "").trim();

  if (!organizationName) {
    return NextResponse.json({ ok: true, clerkOrganizationId: orgId });
  }

  const adminClient = createSupabaseAdminClient();
  const clerk = await clerkClient();
  const clerkOrganization = await clerk.organizations.createOrganization({
    name: organizationName,
    slug: buildOrganizationSlug(organizationName),
    createdBy: userId,
  });

  await adminClient.from("activity_log").insert({
    organization_id: clerkOrganization.id,
    actor_user_id: userId,
    activity_type: "organization_created",
    title: `Utworzono organizację \"${organizationName}\"`,
    description: "Nowe konto organizatora zostało przygotowane i przypisane do organizacji.",
    metadata: {
      clerkOrganizationId: clerkOrganization.id,
      email,
      displayName,
    },
  });

  return NextResponse.json({ ok: true, clerkOrganizationId: clerkOrganization.id });
}
