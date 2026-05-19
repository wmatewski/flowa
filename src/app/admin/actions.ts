"use server";

import { auth, clerkClient, type OrganizationMembershipRole } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import type { Database, Json } from "@/lib/database.types";
import { publicEnv } from "@/lib/env/public";
import { getNeonPool } from "@/lib/neon";
import { createSessionId } from "@/lib/session";
import { getAccessibleSession } from "@/lib/session-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseTimeThresholdRules } from "@/lib/time-thresholds";
import type { MembershipRole } from "@/lib/types";

type SessionAgeMode = "fixed" | "variable";
type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
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
  slug?: string;
  description: string;
  screen_time_limit_minutes: number;
  age_mode: SessionAgeMode;
  fixed_age: number | null;
  age_recommendations_enabled?: boolean;
  age_recommendations?: Json;
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

const ensureUniqueSlug = async (source: string) => {
  const adminClient = createSupabaseAdminClient();
  const baseSlug = slugify(source) || "sessions-flowa";
  const { data, error } = await adminClient
    .from("sessions")
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

const ensureUniqueSessionId = async () => {
  const pool = getNeonPool();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidateId = createSessionId();
    const shortCode = candidateId.replace(/-/g, "").slice(0, 5).toLowerCase();
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id
       FROM public.sessions
       WHERE id::text ILIKE $1
       LIMIT 2`,
      [`${shortCode}%`],
    );

    if (!rows.length) {
      return candidateId;
    }
  }

  return createSessionId();
};

const parsePositiveNumber = (value: FormDataEntryValue | null, fallback: number) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
};

const normalizeAgeRecommendationItem = (item: unknown) => {
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
};

const normalizeAgeRecommendations = (value: unknown): Json => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeAgeRecommendationItem(item))
    .filter((item): item is { label: string; recommendedMinutes: number } => item !== null);
};

const parseAgeRecommendations = (value: FormDataEntryValue | null): Json => {
  if (!value) {
    return [];
  }

  const raw = String(value).trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeAgeRecommendations(parsed);
  } catch {
    if (!(raw.startsWith("{") && raw.endsWith("}"))) {
      return [];
    }

    const encodedItems = [...raw.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((match) => match[1]);

    if (!encodedItems.length) {
      return [];
    }

    const reparsed = encodedItems
      .map((entry) => {
        try {
          return JSON.parse(entry.replace(/\\"/g, '"'));
        } catch {
          return null;
        }
      })
      .filter((entry): entry is unknown => entry !== null);

    return normalizeAgeRecommendations(reparsed);
  }
};

const parseRole = (value: FormDataEntryValue | null): MembershipRole => {
  const parsed = String(value ?? "moderator");
  return parsed === "owner" || parsed === "admin" || parsed === "moderator"
    ? parsed
    : "moderator";
};

const toClerkRole = (role: MembershipRole): OrganizationMembershipRole =>
  role === "moderator" ? "org:member" : "org:admin";

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
  const { orgId } = await auth();

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

  let existingUserId: string | null = null;

  const clerk = await clerkClient();
  const listedUsers = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });

  existingUserId = listedUsers.data[0]?.id ?? null;

  if (!orgId) {
    redirect("/admin/organization?error=forbidden");
  }

  await clerk.organizations.createOrganizationInvitation({
    organizationId: orgId,
    emailAddress: email,
    role: toClerkRole(role),
    inviterUserId: user.id,
    redirectUrl: `${publicEnv.appUrl}/auth?mode=register`,
    publicMetadata: {
      invitedBy: user.id,
      organizationId: organization.id,
      source: "flowa-organization-panel",
    },
  });

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
      existingUserId,
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
  const slug = await ensureUniqueSlug(name);
  const id = await ensureUniqueSessionId();
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from<Pick<SessionRow, "id">>("sessions")
    .insert({
      id,
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
  const rawSlug = String(formData.get("slug") ?? "").trim();
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

  let resolvedSlug: string | undefined;
  if (rawSlug) {
    const candidateSlug = slugify(rawSlug) || slugify(name);
    const { data: existing } = await adminClient
      .from("sessions")
      .select("id, slug")
      .eq("slug", candidateSlug)
      .maybeSingle();
    const existingRow = existing as { id: string; slug: string } | null;
    if (!existingRow || existingRow.id === sessionId) {
      resolvedSlug = candidateSlug;
    } else {
      resolvedSlug = await ensureUniqueSlug(candidateSlug);
    }
  }

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
    slug: resolvedSlug ?? await ensureUniqueSlug(name),
    status: "active",
    created_by: user.id,
  };

  const updatePayload: SessionUpdate = {
    ...basePayload,
    ...updateAgePayload,
    ...(resolvedSlug ? { slug: resolvedSlug } : {}),
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
  const confirmDelete = String(formData.get("confirmDelete") ?? "").trim();
  const { user, organization, membership } = await getAuthenticatedAdmin();

  if (!sessionId) {
    redirect("/admin/sessions?error=missing-session");
  }

  if (confirmDelete !== sessionId) {
    redirect("/admin/sessions?error=delete-confirmation");
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

export const deleteSessionSubmissionAction = async (formData: FormData) => {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const participantKey = String(formData.get("participantKey") ?? "").trim();
  const returnUrl = String(formData.get("returnUrl") ?? "").trim();
  const { user, organization, membership } = await getAuthenticatedAdmin();

  if (!sessionId || !participantKey) {
    redirect(returnUrl || "/admin/sessions");
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
    .from("session_submissions")
    .delete()
    .eq("session_id", sessionId)
    .eq("participant_key", participantKey);

  if (error) {
    throw error;
  }

  await logOrganizationActivity({
    organizationId: organization.id,
    actorUserId: user.id,
    activityType: "submission_deleted",
    title: `Usunięto odpowiedź z sesji \"${accessibleSession.name}\"`,
    description: "Odpowiedź uczestnika została usunięta z systemu.",
    sessionId,
    metadata: {
      participantKey,
    },
  });

  const separator = returnUrl.includes("?") ? "&" : "?";
  redirect(`${returnUrl || `/admin/sessions/${sessionId}/analytics`}${separator}deleted=1`);
};

export const saveOrganizationSettingsAction = async (formData: FormData) => {
  const { organization } = await getAuthenticatedAdmin();
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/admin/settings?error=forbidden");
  }

  const defaultGoodTimeMessage = String(formData.get("defaultGoodTimeMessage") ?? "").trim();
  const defaultExceededTimeMessage = String(formData.get("defaultExceededTimeMessage") ?? "").trim();
  const defaultTimeThresholdRules = parseTimeThresholdRules(formData.get("defaultTimeThresholdRules"));

  const clerk = await clerkClient();
  const existing = await clerk.organizations.getOrganization({ organizationId: orgId });
  const existingMeta = (existing.publicMetadata ?? {}) as Record<string, unknown>;

  await clerk.organizations.updateOrganizationMetadata(orgId, {
    publicMetadata: {
      ...existingMeta,
      defaultGoodTimeMessage: defaultGoodTimeMessage || null,
      defaultExceededTimeMessage: defaultExceededTimeMessage || null,
      defaultTimeThresholdRules,
    },
  });

  await logOrganizationActivity({
    organizationId: organization.id,
    actorUserId: null,
    activityType: "settings_updated",
    title: "Zaktualizowano ustawienia organizacji",
    description: "Domyślne komunikaty zostały zapisane.",
  });

  redirect("/admin/settings?saved=1");
};

export const saveSessionMessagesAction = async (formData: FormData) => {
  await getAuthenticatedAdmin();
  const { orgId } = await auth();
  const sessionId = String(formData.get("sessionId") ?? "").trim();

  if (!orgId || !sessionId) {
    return;
  }

  const useCustomMessages = String(formData.get("useCustomMessages") ?? "") === "1";

  const clerk = await clerkClient();
  const existing = await clerk.organizations.getOrganization({ organizationId: orgId });
  const existingMeta = (existing.publicMetadata ?? {}) as Record<string, unknown>;
  const sessionMessages = (existingMeta.sessionMessages ?? {}) as Record<string, unknown>;
  const existingSessionMessages = (sessionMessages[sessionId] ?? {}) as {
    goodTimeMessage?: string | null;
    exceededTimeMessage?: string | null;
    timeThresholdRules?: unknown;
  };
  const goodTimeMessage = formData.has("goodTimeMessage")
    ? String(formData.get("goodTimeMessage") ?? "").trim()
    : String(existingSessionMessages.goodTimeMessage ?? "").trim();
  const exceededTimeMessage = formData.has("exceededTimeMessage")
    ? String(formData.get("exceededTimeMessage") ?? "").trim()
    : String(existingSessionMessages.exceededTimeMessage ?? "").trim();
  const timeThresholdRules = formData.has("timeThresholdRules")
    ? parseTimeThresholdRules(formData.get("timeThresholdRules"))
    : parseTimeThresholdRules(JSON.stringify(existingSessionMessages.timeThresholdRules ?? []));

  await clerk.organizations.updateOrganizationMetadata(orgId, {
    publicMetadata: {
      ...existingMeta,
      sessionMessages: {
        ...sessionMessages,
        [sessionId]: {
          useCustomMessages,
          goodTimeMessage: goodTimeMessage || null,
          exceededTimeMessage: exceededTimeMessage || null,
          timeThresholdRules,
        },
      },
    },
  });

  redirect(`/admin/sessions/${sessionId}/settings?saved=1`);
};
