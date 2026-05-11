import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  activatePendingMemberships,
  ensureProfileForUser,
  type AuthenticatedUser,
} from "@/lib/admin-auth";
import { getSessionOrganizationIds, getSessionVerificationClaim } from "@/lib/clerk-session";
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

const buildOrganizationSlug = (source: string) => {
  const baseSlug = slugify(source) || "organization-flowa";
  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
};

const getAuthenticatedUser = async (): Promise<{
  user: AuthenticatedUser;
  orgId: string | null;
  sessionClaims: Record<string, unknown> | null | undefined;
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
    user: {
      id: user.id,
      email,
      displayName: [user.firstName, user.lastName].filter(Boolean).join(" "),
      createdAt: new Date((user as { createdAt?: Date | string | number }).createdAt ?? Date.now()).toISOString(),
      emailVerified: verificationClaim ?? String(primaryAddress?.verification?.status ?? "") === "verified",
    },
    orgId: orgId ?? null,
    sessionClaims: sessionClaims as Record<string, unknown> | null | undefined,
  };
};

export async function POST(request: Request) {
  const authState = await getAuthenticatedUser();

  if (!authState) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { user, orgId, sessionClaims } = authState;

  await ensureProfileForUser(user);
  await activatePendingMemberships(user);

  const payload = await request
    .json()
    .catch(() => ({}) as { organizationName?: string | null });
  const organizationName = String(payload.organizationName ?? "").trim();

  if (!organizationName) {
    return NextResponse.json({ ok: true, clerkOrganizationId: orgId });
  }

  const sessionOrganizationIds = getSessionOrganizationIds(sessionClaims, orgId);

  if (sessionOrganizationIds.length > 0) {
    return NextResponse.json({ ok: true, clerkOrganizationId: sessionOrganizationIds[0] ?? null });
  }

  const adminClient = createSupabaseAdminClient();
  const clerk = await clerkClient();
  const clerkOrganization = await clerk.organizations.createOrganization({
    name: organizationName,
    slug: buildOrganizationSlug(organizationName),
    createdBy: user.id,
  });

  const { error: membershipError } = await adminClient.from("memberships").upsert(
    {
      organization_id: clerkOrganization.id,
      user_id: user.id,
      invited_email: user.email,
      role: "owner",
      status: "active",
      created_by: user.id,
    },
    { onConflict: "organization_id,invited_email" },
  );

  if (membershipError) {
    await clerk.organizations.deleteOrganization(clerkOrganization.id).catch(() => undefined);
    throw membershipError;
  }

  await adminClient
    .from("profiles")
    .update({ default_organization_id: clerkOrganization.id })
    .eq("user_id", user.id);

  await adminClient.from("activity_log").insert({
    organization_id: clerkOrganization.id,
    actor_user_id: user.id,
    activity_type: "organization_created",
    title: `Utworzono organizację \"${organizationName}\"`,
    description: "Nowe konto organizatora zostało przygotowane i przypisane do organizacji.",
    metadata: {
      clerkOrganizationId: clerkOrganization.id,
    },
  });

  return NextResponse.json({ ok: true, clerkOrganizationId: clerkOrganization.id });
}
