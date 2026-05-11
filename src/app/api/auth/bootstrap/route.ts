import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  activatePendingMemberships,
  ensureProfileForUser,
  type AuthenticatedUser,
} from "@/lib/admin-auth";
import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type OrganizationRow = Database["flowa"]["Tables"]["organizations"]["Row"];

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const normalizeEmail = (value: string | null | undefined) =>
  String(value ?? "").trim().toLowerCase();

const ensureUniqueSlug = async (source: string) => {
  const adminClient = createSupabaseAdminClient();
  const baseSlug = slugify(source) || "organization-flowa";
  const { data, error } = await adminClient
    .from("organizations")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);

  if (error) {
    throw error;
  }

  const existingSlugs = new Set(((data as Array<{ slug: string }> | null) ?? []).map((item) => item.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
};

const getAuthenticatedUser = async (): Promise<AuthenticatedUser | null> => {
  const { userId } = await auth();

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

  if (!email) {
    return null;
  }

  return {
    id: user.id,
    email,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" "),
  };
};

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  await ensureProfileForUser(user);
  await activatePendingMemberships(user);

  const payload = await request
    .json()
    .catch(() => ({}) as { organizationName?: string | null });
  const organizationName = String(payload.organizationName ?? "").trim();

  if (!organizationName) {
    return NextResponse.json({ ok: true });
  }

  const adminClient = createSupabaseAdminClient();
  const { count, error: activeMembershipError } = await adminClient
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (activeMembershipError) {
    throw activeMembershipError;
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ ok: true, clerkOrganizationId: null });
  }

  const organizationSlug = await ensureUniqueSlug(organizationName);
  const { data: organizationRow, error: organizationError } = await adminClient
    .from<Pick<OrganizationRow, "id">>("organizations")
    .insert({
      name: organizationName,
      slug: organizationSlug,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (organizationError || !organizationRow) {
    throw organizationError;
  }

  const clerk = await clerkClient();
  let clerkOrganization;

  try {
    clerkOrganization = await clerk.organizations.createOrganization({
      name: organizationName,
      slug: organizationSlug,
      createdBy: user.id,
      publicMetadata: {
        localOrganizationId: organizationRow.id,
      },
    });
  } catch (error) {
    await adminClient.from("organizations").delete().eq("id", organizationRow.id);
    throw error;
  }

  const { error: membershipError } = await adminClient.from("memberships").upsert(
    {
      organization_id: organizationRow.id,
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
    await adminClient.from("organizations").delete().eq("id", organizationRow.id);
    throw membershipError;
  }

  await adminClient
    .from("profiles")
    .update({ default_organization_id: organizationRow.id })
    .eq("user_id", user.id);

  await adminClient.from("activity_log").insert({
    organization_id: organizationRow.id,
    actor_user_id: user.id,
    activity_type: "organization_created",
    title: `Utworzono organizację \"${organizationName}\"`,
    description: "Nowe konto organizatora zostało przygotowane i przypisane do organizacji.",
    metadata: {},
  });

  return NextResponse.json({ ok: true, clerkOrganizationId: clerkOrganization.id });
}
