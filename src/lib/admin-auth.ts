import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Membership, Organization, Profile } from "@/lib/types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
}

const normalizeEmail = (value: string | null | undefined) =>
  String(value ?? "").trim().toLowerCase();

const deriveDisplayName = (user: AuthenticatedUser) => {
  const fullName = user.displayName;

  if (fullName?.trim()) {
    return fullName.trim();
  }

  return normalizeEmail(user.email).split("@")[0] ?? "Organizator";
};

const getClerkLocalOrganizationId = async (orgId: string | null | undefined) => {
  if (!orgId) {
    return null;
  }

  const client = await clerkClient();
  const organization = await client.organizations.getOrganization(orgId);
  const localOrganizationId = (organization.publicMetadata as { localOrganizationId?: unknown } | null)
    ?.localOrganizationId;

  return typeof localOrganizationId === "string" ? localOrganizationId : null;
};

export const getAuthenticatedUser = async (): Promise<AuthenticatedUser> => {
  const { userId } = await auth();

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

  if (!email) {
    throw new Error("Authenticated Clerk user is missing an e-mail address.");
  }

  return {
    id: user.id,
    email,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" "),
  };
};

export const ensureProfileForUser = async (user: AuthenticatedUser): Promise<Profile> => {
  const email = normalizeEmail(user.email);

  if (!email) {
    throw new Error("Authenticated user is missing an e-mail address.");
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        email,
        display_name: deriveDisplayName(user),
      },
      { onConflict: "user_id" },
    )
    .select("user_id, email, display_name, default_organization_id, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
};

export const activatePendingMemberships = async (user: AuthenticatedUser) => {
  const email = normalizeEmail(user.email);

  if (!email) {
    return;
  }

  const adminClient = createSupabaseAdminClient();

  const { error: pendingError } = await adminClient
    .from("memberships")
    .update({
      user_id: user.id,
      status: "active",
      invited_email: email,
    })
    .is("user_id", null)
    .eq("invited_email", email);

  if (pendingError) {
    throw pendingError;
  }

  const { error: existingError } = await adminClient
    .from("memberships")
    .update({
      status: "active",
      invited_email: email,
    })
    .eq("user_id", user.id)
    .eq("status", "invited");

  if (existingError) {
    throw existingError;
  }
};

export const getAuthenticatedAdmin = async (): Promise<{
  user: AuthenticatedUser;
  profile: Profile;
  organization: Organization;
  membership: Membership;
  memberships: Membership[];
}> => {
  const { orgId } = await auth();
  const user = await getAuthenticatedUser();

  await activatePendingMemberships(user);

  const profile = await ensureProfileForUser(user);
  const clerkLocalOrganizationId = await getClerkLocalOrganizationId(orgId);

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("memberships")
    .select("id, organization_id, user_id, invited_email, role, status, created_by, created_at, updated_at")
    .eq("user_id", user.id)
    .neq("status", "disabled")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const memberships = (data as Membership[] | null) ?? [];

  if (!memberships.length) {
    redirect("/auth");
  }

  const organizationIds = [...new Set(memberships.map((membership) => membership.organization_id))];
  const { data: organizationRows, error: organizationError } = await adminClient
    .from("organizations")
    .select("id, name, slug, created_by, created_at, updated_at")
    .in("id", organizationIds);

  if (organizationError) {
    throw organizationError;
  }

  const organizations = (organizationRows as Organization[] | null) ?? [];
  const targetOrganizationId =
    (clerkLocalOrganizationId && organizations.find((organization) => organization.id === clerkLocalOrganizationId)?.id) ||
    (profile.default_organization_id &&
    organizations.some((organization) => organization.id === profile.default_organization_id)
      ? profile.default_organization_id
      : memberships.find((membership) => membership.role === "owner")?.organization_id ??
        memberships[0]?.organization_id);

  if (!targetOrganizationId) {
    redirect("/auth?error=not-authorized");
  }

  const organization = organizations.find((item) => item.id === targetOrganizationId);
  const membership = memberships.find((item) => item.organization_id === targetOrganizationId);

  if (!organization || !membership) {
    redirect("/auth?error=not-authorized");
  }

  if (profile.default_organization_id !== targetOrganizationId) {
    await adminClient
      .from("profiles")
      .update({ default_organization_id: targetOrganizationId })
      .eq("user_id", user.id);

    profile.default_organization_id = targetOrganizationId;
  }

  return {
    user,
    profile,
    organization,
    membership,
    memberships,
  };
};