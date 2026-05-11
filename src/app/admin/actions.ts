"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import type { Database, Json } from "@/lib/database.types";
import { publicEnv } from "@/lib/env/public";
import { getAccessibleSession } from "@/lib/session-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MembershipRole } from "@/lib/types";

type SessionAgeMode = "fixed" | "variable";
type SessionRow = Database["flowa"]["Tables"]["sessions"]["Row"];
type SessionInsert = {
  organization_id: string;
  slug: string;
  name: string;
  description: string;
  screen_time_limit_minutes: number;
  age_mode: SessionAgeMode;
  fixed_age: number | null;
  age_recommendations_enabled: boolean;
  age_recommendations: Json;
  status: "active";
  created_by: string;
};
type SessionUpdate = {
  organization_id: string;
  name: string;
  description: string;
  screen_time_limit_minutes: number;
  age_mode: SessionAgeMode;
  fixed_age: number | null;
  age_recommendations_enabled?: boolean;
  age_recommendations?: Json;
};
type SessionCollaboratorInsert = {
  session_id: string;
  membership_id: string;
  role: MembershipRole;
};

const normalizeEmail = (value: FormDataEntryValue | string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const ensureUniqueSlug = async (
  table: "organizations" | "sessions",
  source: string,
) => {
  const adminClient = createSupabaseAdminClient();
  const baseSlug = slugify(source) || `${table}-flowa`;
  const { data, error } = await adminClient
    .from(table)
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

const parsePositiveNumber = (value: FormDataEntryValue | null, fallback: number) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const parseAgeRecommendations = (value: FormDataEntryValue | null): Json => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(value));

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (typeof item !== "object" || item == null) {
          return null;
        }

        const label = String((item as { label?: unknown }).label ?? "").trim();
        const recommendedMinutes = Number((item as { recommendedMinutes?: unknown }).recommendedMinutes);

        if (!label || Number.isNaN(recommendedMinutes) || recommendedMinutes <= 0) {
          return null;
        }

        return {
          label,
          recommendedMinutes: Math.floor(recommendedMinutes),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const parseRole = (value: FormDataEntryValue | null): MembershipRole => {
  const parsed = String(value ?? "moderator");
  return parsed === "owner" || parsed === "admin" || parsed === "moderator"
    ? parsed
    : "moderator";
};

const logOrganizationActivity = async (input: {
  organizationId: string;
  actorUserId: string | null;
  activityType: string;
  title: string;
  description?: string | null;
  sessionId?: string | null;
  metadata?: Json;
}) => {
  const adminClient = createSupabaseAdminClient();
  await adminClient.from("activity_log").insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    activity_type: input.activityType,
    title: input.title,
    description: input.description ?? null,
    session_id: input.sessionId ?? null,
    metadata: input.metadata ?? {},
  });
};

export const inviteAdminAction = async (formData: FormData) => {
  const email = normalizeEmail(formData.get("email"));
  const role = parseRole(formData.get("role"));
  const sessionId = String(formData.get("sessionId") ?? "").trim() || null;

  if (!email) {
    redirect("/admin/organization?error=missing-email");
  }

  const { user, organization, membership } = await getAuthenticatedAdmin();

  if (membership.role === "moderator") {
    redirect("/admin/organization?error=forbidden");
  }

  if (sessionId) {
    const session = await getAccessibleSession(
      {
        organizationId: organization.id,
        membershipId: membership.id,
        role: membership.role,
        userId: user.id,
      },
      sessionId,
    );

    if (!session) {
      redirect("/admin/organization?error=forbidden");
    }
  }

  const adminClient = createSupabaseAdminClient();
  let existingUserId: string | null = null;

  const clerk = await clerkClient();
  const listedUsers = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });

  existingUserId = listedUsers.data[0]?.id ?? null;

  if (!existingUserId) {
    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${publicEnv.appUrl}/auth?mode=register`,
      publicMetadata: {
        invitedBy: user.id,
        organizationId: organization.id,
        source: "flowa-organization-panel",
      },
    });
  }

  if (existingUserId) {
    await adminClient.from("profiles").upsert(
      {
        user_id: existingUserId,
        email,
        display_name: email.split("@")[0],
      },
      { onConflict: "user_id" },
    );
  }

  const membershipResult = await adminClient
    .from<{
      id: string;
      organization_id: string;
      user_id: string | null;
      invited_email: string;
      role: MembershipRole;
      status: "invited" | "active" | "disabled";
      created_by: string | null;
      created_at: string;
      updated_at: string;
    }>("memberships")
    .upsert(
    {
      organization_id: organization.id,
      user_id: existingUserId,
      invited_email: email,
      role,
      status: existingUserId ? "active" : "invited",
      created_by: user.id,
    },
    { onConflict: "organization_id,invited_email" },
  )
    .select("id, organization_id, user_id, invited_email, role, status, created_by, created_at, updated_at")
    .single();

  if (membershipResult.error || !membershipResult.data) {
    throw membershipResult.error;
  }

  if (sessionId) {
    const { error: collaboratorError } = await adminClient.from("session_collaborators").upsert(
      {
        session_id: sessionId,
        membership_id: membershipResult.data.id,
        role,
      },
      { onConflict: "session_id,membership_id" },
    );

    if (collaboratorError) {
      throw collaboratorError;
    }
  }

  await logOrganizationActivity({
    organizationId: organization.id,
    actorUserId: user.id,
    activityType: "member_invited",
    title: `Dodano współtwórcę ${email}`,
    description: sessionId
      ? "Użytkownik został przypisany do organizacji oraz do wybranej sesji."
      : "Użytkownik został przypisany do organizacji.",
    sessionId,
    metadata: {
      email,
      role,
      membershipId: membershipResult.data.id,
    },
  });

  redirect(`/admin/organization?invite=sent${sessionId ? `&sessionId=${sessionId}` : ""}`);
};

export const createSessionAction = async (formData: FormData) => {
  const { user, organization } = await getAuthenticatedAdmin();
  const defaultName = `Nowa sesja ${new Date().toLocaleDateString("pl-PL")}`;
  const name = String(formData.get("name") ?? defaultName).trim() || defaultName;
  const ageMode: SessionAgeMode = String(formData.get("ageMode") ?? "variable") === "fixed" ? "fixed" : "variable";
  const fixedAge = ageMode === "fixed" ? parsePositiveNumber(formData.get("fixedAge"), 18) : null;
  const ageRecommendationsEnabled = String(formData.get("ageRecommendationsEnabled") ?? "") === "1";
  const ageRecommendations = parseAgeRecommendations(formData.get("ageRecommendations"));
  const slug = await ensureUniqueSlug("sessions", name);
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from<Pick<SessionRow, "id">>("sessions")
    .insert({
      organization_id: organization.id,
      slug,
      name,
      description: "Sesja przygotowana w panelu Wojticore Flowa.",
      screen_time_limit_minutes: 60,
      age_mode: ageMode,
      fixed_age: fixedAge,
      age_recommendations_enabled: ageRecommendationsEnabled,
      age_recommendations: ageRecommendations,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error;
  }

  await logOrganizationActivity({
    organizationId: organization.id,
    actorUserId: user.id,
    activityType: "session_created",
    title: `Utworzono sesję \"${name}\"`,
    description: "Nowa sesja została dodana do organizacji.",
    sessionId: data.id,
  });

  redirect(`/admin/sessions/${data.id}/settings?created=1`);
};

export const saveSessionSettingsAction = async (formData: FormData) => {
  const { user, organization, membership } = await getAuthenticatedAdmin();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const ageMode: SessionAgeMode =
    String(formData.get("ageMode") ?? "variable") === "fixed" ? "fixed" : "variable";
  const fixedAge = ageMode === "fixed" ? parsePositiveNumber(formData.get("fixedAge"), 18) : null;
  const limitMinutes = Math.min(parsePositiveNumber(formData.get("limitMinutes"), 60), 1440);
  const ageRecommendationsEnabled = formData.has("ageRecommendationsEnabled")
    ? String(formData.get("ageRecommendationsEnabled") ?? "") === "1"
    : undefined;
  const ageRecommendations = formData.has("ageRecommendations")
    ? parseAgeRecommendations(formData.get("ageRecommendations"))
    : undefined;
  const collaboratorMembershipIds = formData
    .getAll("collaboratorMembershipIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!name) {
    redirect(sessionId ? `/admin/sessions/${sessionId}/settings?error=missing-name` : "/admin/sessions/new?error=missing-name");
  }

  if (sessionId) {
    const session = await getAccessibleSession(
      {
        organizationId: organization.id,
        membershipId: membership.id,
        role: membership.role,
        userId: user.id,
      },
      sessionId,
    );

    if (!session) {
      redirect("/admin/sessions?error=forbidden");
    }
  }

  const adminClient = createSupabaseAdminClient();
  const basePayload = {
    organization_id: organization.id,
    name,
    description,
    screen_time_limit_minutes: limitMinutes,
    age_mode: ageMode,
    fixed_age: fixedAge,
  };

  const createAgePayload = {
    age_recommendations_enabled: ageRecommendationsEnabled ?? true,
    age_recommendations: ageRecommendations ?? [],
  };

  const updateAgePayload = {
    ...(ageRecommendationsEnabled === undefined ? {} : { age_recommendations_enabled: ageRecommendationsEnabled }),
    ...(ageRecommendations === undefined ? {} : { age_recommendations: ageRecommendations }),
  };

  const insertPayload: SessionInsert = {
    ...basePayload,
    ...createAgePayload,
    slug: await ensureUniqueSlug("sessions", name),
    status: "active",
    created_by: user.id,
  };

  const updatePayload: SessionUpdate = {
    ...basePayload,
    ...updateAgePayload,
  };

  const sessionResult = sessionId
    ? await adminClient
      .from<Pick<SessionRow, "id">>("sessions")
        .update(updatePayload)
        .eq("id", sessionId)
        .eq("organization_id", organization.id)
        .select("id")
        .single()
    : await adminClient
      .from<Pick<SessionRow, "id">>("sessions")
        .insert(insertPayload)
        .select("id")
        .single();

  if (sessionResult.error || !sessionResult.data?.id) {
    throw sessionResult.error;
  }

  const resolvedSessionId = sessionResult.data.id;

  const { error: deleteCollaboratorsError } = await adminClient
    .from("session_collaborators")
    .delete()
    .eq("session_id", resolvedSessionId);

  if (deleteCollaboratorsError) {
    throw deleteCollaboratorsError;
  }

  if (collaboratorMembershipIds.length) {
    const collaboratorRows: SessionCollaboratorInsert[] = collaboratorMembershipIds.map(
      (membershipId) => ({
        session_id: resolvedSessionId,
        membership_id: membershipId,
        role: "moderator",
      }),
    );

    const { error: collaboratorInsertError } = await adminClient
      .from("session_collaborators")
      .insert(collaboratorRows);

    if (collaboratorInsertError) {
      throw collaboratorInsertError;
    }
  }

  await logOrganizationActivity({
    organizationId: organization.id,
    actorUserId: user.id,
    activityType: sessionId ? "session_updated" : "session_created",
    title: `${sessionId ? "Zaktualizowano" : "Utworzono"} sesję \"${name}\"`,
    description: "Parametry sesji zostały zapisane.",
    sessionId: resolvedSessionId,
  });

  redirect(`/admin/sessions/${resolvedSessionId}/settings?saved=1`);
};

export const deleteSessionAction = async (formData: FormData) => {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const { user, organization, membership } = await getAuthenticatedAdmin();

  if (!sessionId) {
    redirect("/admin/sessions?error=missing-session");
  }

  const accessibleSession = await getAccessibleSession(
    {
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
    sessionId,
  );

  if (!accessibleSession) {
    redirect("/admin/sessions?error=forbidden");
  }

  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .eq("organization_id", organization.id);

  if (error) {
    throw error;
  }

  await logOrganizationActivity({
    organizationId: organization.id,
    actorUserId: user.id,
    activityType: "session_deleted",
    title: `Usunięto sesję \"${accessibleSession.name}\"`,
    description: "Sesja została usunięta z organizacji.",
  });

  redirect("/admin/sessions?deleted=1");
};
