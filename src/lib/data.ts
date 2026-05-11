import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import {
  average,
  buildFocusScore,
  buildParticipantInsight,
  getParticipantStatusLabel,
  getParticipantTone,
  percentageDelta,
} from "@/lib/analytics";
import { formatInitials } from "@/lib/format";
import {
  getAccessibleSession,
  getVisibleSessionIds,
  type SessionAccessContext,
} from "@/lib/session-access";
import { getClerkOrganizationSummary } from "@/lib/clerk-organizations";
import { normalizeParticipantMetadata } from "@/lib/participant-metadata";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ActivityLog,
  DashboardActivity,
  OrganizationMember,
  OrganizationMembersData,
  OrganizerDashboardData,
  PublicLiveSessionData,
  Session,
  SessionAgeStatistic,
  SessionExperienceData,
  LiveSessionEntry,
  SessionOverview,
  SessionParticipantRow,
  SessionSettingsData,
  SessionStatisticsData,
  SessionSubmission,
} from "@/lib/types";
import { redirect } from "next/navigation";

const sessionColumns =
  "id, organization_id, slug, name, description, screen_time_limit_minutes, age_mode, fixed_age, status, created_by, starts_at, ends_at, created_at, updated_at";
const sessionOverviewColumns =
  "session_id, organization_id, slug, name, status, screen_time_limit_minutes, created_at, starts_at, ends_at, participant_count, average_minutes, maximum_minutes, latest_submission_at";
const latestParticipantColumns =
  "id, session_id, participant_key, age, screen_time_minutes, detected_os, ip_address, entered_at, client_metadata, user_agent, submitted_at, entry_date";

const DAY_MS = 24 * 60 * 60 * 1000;

const mapOrganizationRole = (role: string | null | undefined) => {
  const normalized = String(role ?? "").toLowerCase();

  if (normalized.includes("owner")) {
    return "owner";
  }

  if (normalized.includes("admin")) {
    return "admin";
  }

  return "moderator";
};

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

const countInPeriods = (dates: string[], periodDays: number) => {
  const now = Date.now();
  const currentStart = now - periodDays * DAY_MS;
  const previousStart = currentStart - periodDays * DAY_MS;

  const current = dates.filter((value) => new Date(value).getTime() >= currentStart).length;
  const previous = dates.filter((value) => {
    const timestamp = new Date(value).getTime();
    return timestamp >= previousStart && timestamp < currentStart;
  }).length;

  return { current, previous };
};

const averageForWindow = (
  entries: SessionSubmission[],
  startTimestamp: number,
  endTimestamp?: number,
) => {
  const values = entries
    .filter((entry) => {
      const timestamp = new Date(entry.submitted_at).getTime();
      return timestamp >= startTimestamp && (endTimestamp == null || timestamp < endTimestamp);
    })
    .map((entry) => entry.screen_time_minutes);

  return average(values);
};

interface ClerkMembershipUserData {
  id?: string | null;
  userId?: string | null;
  identifier?: string | null;
  emailAddress?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
  emailAddresses?: Array<{
    emailAddress?: string | null;
  }> | null;
}

interface ClerkMembershipSummary {
  id: string;
  role: string | null;
  createdAt?: unknown;
  created_at?: unknown;
  publicUserData?: ClerkMembershipUserData | null;
}

const buildMemberList = async (organizationId: string): Promise<OrganizationMember[]> => {
  const clerk = await clerkClient();
  const result = await clerk.organizations.getOrganizationMembershipList({
    organizationId,
    limit: 100,
  });

  return ((result.data as ClerkMembershipSummary[] | undefined) ?? []).map((membership) => {
    const userData = membership.publicUserData ?? {};
    const email = String(
      userData.identifier ??
        userData.emailAddress ??
        userData.primaryEmailAddress?.emailAddress ??
        userData.emailAddresses?.[0]?.emailAddress ??
        "",
    ).trim();
    const displayName =
      [userData.firstName, userData.lastName].filter(Boolean).join(" ").trim() ||
      email.split("@")[0] ||
      email ||
      "Organizator";

    return {
      id: membership.id,
      membershipId: membership.id,
      userId: String(userData.userId ?? userData.id ?? "").trim(),
      email,
      displayName,
      initials: formatInitials(displayName),
      role: mapOrganizationRole(membership.role),
      status: "active",
      createdAt: toIsoString(membership.createdAt ?? membership.created_at),
    } satisfies OrganizationMember;
  });
};

const buildDashboardActivities = (
  activities: ActivityLog[],
  sessions: SessionOverview[],
): DashboardActivity[] => {
  if (activities.length) {
    return activities.map((activity) => ({
      id: String(activity.id),
      title: activity.title,
      description: activity.description,
      tag:
        activity.activity_type === "submission_received"
          ? "Zakończona"
          : activity.activity_type === "session_created"
            ? "Zaplanowana"
            : activity.activity_type === "member_invited"
              ? "Zaproszenie"
              : "Informacja",
      createdAt: activity.created_at,
    }));
  }

  return sessions.slice(0, 3).map((session) => ({
    id: session.session_id,
    title: `Sesja \"${session.name}\"`,
    description:
      session.status === "completed"
        ? "Sesja została zakończona i pozostaje dostępna w raportach."
        : "Nowa sesja została utworzona i jest gotowa do udostępnienia uczestnikom.",
    tag: session.status === "completed" ? "Zakończona" : "Zaplanowana",
    createdAt: session.latest_submission_at ?? session.created_at,
  }));
};

export const getOrganizationDashboardData = async (
  access: SessionAccessContext,
): Promise<OrganizerDashboardData> => {
  const supabase = createSupabaseAdminClient();
  const visibleSessionIds = await getVisibleSessionIds(access);

  if (visibleSessionIds?.length === 0) {
    return {
      metrics: {
        totalSessions: 0,
        totalParticipants: 0,
        averageMinutes: null,
        sessionTrend: null,
        averageTrend: null,
      },
      sessions: [],
      recentActivities: [],
      members: [],
    };
  }

  const sessionOverviewQuery = supabase
    .from("session_overview")
    .select(sessionOverviewColumns)
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false });

  const activityQuery = supabase
    .from("activity_log")
    .select("id, organization_id, session_id, actor_user_id, activity_type, title, description, metadata, created_at")
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (visibleSessionIds) {
    sessionOverviewQuery.in("session_id", visibleSessionIds);
    activityQuery.in("session_id", visibleSessionIds);
  }

  const [sessionOverviewResult, activityResult, members] = await Promise.all([
    sessionOverviewQuery,
    activityQuery,
    buildMemberList(access.organizationId),
  ]);

  if (sessionOverviewResult.error) {
    throw sessionOverviewResult.error;
  }

  if (activityResult.error) {
    throw activityResult.error;
  }

  const sessions = (sessionOverviewResult.data as SessionOverview[] | null) ?? [];
  const sessionIds = sessions.map((session) => session.session_id);

  let latestParticipants: SessionSubmission[] = [];

  if (sessionIds.length) {
    const { data, error } = await supabase
      .from("latest_session_participants")
      .select(latestParticipantColumns)
      .in("session_id", sessionIds)
      .order("submitted_at", { ascending: false })
      .limit(2000);

    if (error) {
      throw error;
    }

    latestParticipants = (data as SessionSubmission[] | null) ?? [];
  }

  const sessionPeriods = countInPeriods(
    sessions.map((session) => session.created_at),
    30,
  );
  const now = Date.now();
  const currentWeekAverage = averageForWindow(latestParticipants, now - 7 * DAY_MS);
  const previousWeekAverage = averageForWindow(
    latestParticipants,
    now - 14 * DAY_MS,
    now - 7 * DAY_MS,
  );

  return {
    metrics: {
      totalSessions: sessions.length,
      totalParticipants: latestParticipants.length,
      averageMinutes: average(latestParticipants.map((entry) => entry.screen_time_minutes)),
      sessionTrend: percentageDelta(sessionPeriods.current, sessionPeriods.previous),
      averageTrend: percentageDelta(currentWeekAverage, previousWeekAverage),
    },
    sessions,
    recentActivities: buildDashboardActivities(
      (activityResult.data as ActivityLog[] | null) ?? [],
      sessions,
    ),
    members,
  };
};

export const getSessionsListData = async (access: SessionAccessContext): Promise<SessionOverview[]> => {
  const supabase = createSupabaseAdminClient();
  const visibleSessionIds = await getVisibleSessionIds(access);

  if (visibleSessionIds?.length === 0) {
    return [];
  }

  const query = supabase
    .from("session_overview")
    .select(sessionOverviewColumns)
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false });

  if (visibleSessionIds) {
    query.in("session_id", visibleSessionIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as SessionOverview[] | null) ?? [];
};

export const getPublicLiveSessionData = async (
  slug: string,
  limit = 25,
): Promise<PublicLiveSessionData> => {
  const supabase = createSupabaseAdminClient();
  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select(sessionColumns)
    .eq("slug", slug)
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const session = sessionRow as Session;
  const [overviewResult, participantResult] = await Promise.all([
    supabase
      .from("session_overview")
      .select(sessionOverviewColumns)
      .eq("session_id", session.id)
      .maybeSingle(),
    supabase
      .from("latest_session_participants")
      .select(latestParticipantColumns)
      .eq("session_id", session.id)
      .order("submitted_at", { ascending: false })
      .limit(limit),
  ]);

  if (overviewResult.error) {
    throw overviewResult.error;
  }

  if (participantResult.error) {
    throw participantResult.error;
  }

  const entries = (((participantResult.data as SessionSubmission[] | null) ?? [])).map(
    (entry) =>
      ({
        id: entry.id,
        age: entry.age,
        operatingSystem: entry.detected_os,
        screenTimeMinutes: entry.screen_time_minutes,
        submittedAt: entry.submitted_at,
      }) satisfies LiveSessionEntry,
  );

  return {
    session,
    overview: (overviewResult.data as SessionOverview | null) ?? null,
    entries,
  };
};

export const getSessionStatisticsData = async (
  access: SessionAccessContext,
  sessionId: string,
): Promise<SessionStatisticsData> => {
  const accessibleSession = await getAccessibleSession(access, sessionId);

  if (!accessibleSession) {
    redirect("/admin/sessions?error=forbidden");
  }

  const supabase = createSupabaseAdminClient();

  const [sessionResult, overviewResult, ageStatsResult, participantResult] = await Promise.all([
    supabase
      .from("sessions")
      .select(sessionColumns)
      .eq("id", sessionId)
      .eq("organization_id", access.organizationId)
      .single(),
    supabase
      .from("session_overview")
      .select(sessionOverviewColumns)
      .eq("session_id", sessionId)
      .eq("organization_id", access.organizationId)
      .maybeSingle(),
    supabase
      .from("session_age_statistics")
      .select("session_id, age_bucket, participants, average_minutes, maximum_minutes")
      .eq("session_id", sessionId),
    supabase
      .from("latest_session_participants")
      .select(latestParticipantColumns)
      .eq("session_id", sessionId)
      .order("screen_time_minutes", { ascending: false })
      .limit(200),
  ]);

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (overviewResult.error) {
    throw overviewResult.error;
  }

  if (ageStatsResult.error) {
    throw ageStatsResult.error;
  }

  if (participantResult.error) {
    throw participantResult.error;
  }

  const session = sessionResult.data as Session;
  const participantRows = (participantResult.data as SessionSubmission[] | null) ?? [];
  const participants = participantRows.map((entry, index) => ({
    id: entry.id,
    participantKey: entry.participant_key,
    label: `Uczestnik ${String(index + 1).padStart(2, "0")}`,
    age: entry.age,
    screenTimeMinutes: entry.screen_time_minutes,
    statusTone: getParticipantTone(entry.screen_time_minutes, session.screen_time_limit_minutes),
    statusLabel: getParticipantStatusLabel(
      entry.screen_time_minutes,
      session.screen_time_limit_minutes,
    ),
    detectedOperatingSystem: entry.detected_os,
    enteredAt: entry.entered_at,
    ipAddress: entry.ip_address,
    userAgent: entry.user_agent,
    clientMetadata: normalizeParticipantMetadata(entry.client_metadata),
    submittedAt: entry.submitted_at,
  })) satisfies SessionParticipantRow[];
  return {
    session,
    overview: (overviewResult.data as SessionOverview | null) ?? null,
    ageStatistics: (ageStatsResult.data as SessionAgeStatistic[] | null) ?? [],
    participants,
    focusScore: buildFocusScore(
      participantRows.map((entry) => entry.screen_time_minutes),
      session.screen_time_limit_minutes,
    ),
  };
};

export const getSessionWorkspaceSummary = async (
  access: SessionAccessContext,
  sessionId: string,
): Promise<{ session: Session; overview: SessionOverview | null }> => {
  const accessibleSession = await getAccessibleSession(access, sessionId);

  if (!accessibleSession) {
    redirect("/admin/sessions?error=forbidden");
  }

  const supabase = createSupabaseAdminClient();
  const [sessionResult, overviewResult] = await Promise.all([
    supabase
      .from("sessions")
      .select(sessionColumns)
      .eq("id", sessionId)
      .eq("organization_id", access.organizationId)
      .single(),
    supabase
      .from("session_overview")
      .select(sessionOverviewColumns)
      .eq("session_id", sessionId)
      .eq("organization_id", access.organizationId)
      .maybeSingle(),
  ]);

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (overviewResult.error) {
    throw overviewResult.error;
  }

  return {
    session: sessionResult.data as Session,
    overview: (overviewResult.data as SessionOverview | null) ?? null,
  };
};

export const getSessionSettingsData = async (
  access: SessionAccessContext,
  sessionId: string,
): Promise<SessionSettingsData> => {
  const accessibleSession = await getAccessibleSession(access, sessionId);

  if (!accessibleSession) {
    redirect("/admin/sessions?error=forbidden");
  }

  const supabase = createSupabaseAdminClient();

  const [sessionResult, overviewResult] = await Promise.all([
    supabase
      .from("sessions")
      .select(sessionColumns)
      .eq("id", sessionId)
      .eq("organization_id", access.organizationId)
      .single(),
    supabase
      .from("session_overview")
      .select(sessionOverviewColumns)
      .eq("session_id", sessionId)
      .eq("organization_id", access.organizationId)
      .maybeSingle(),
  ]);

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (overviewResult.error) {
    throw overviewResult.error;
  }

  return {
    session: sessionResult.data as Session,
    overview: (overviewResult.data as SessionOverview | null) ?? null,
  };
};

export const getOrganizationMembersData = async (
  access: SessionAccessContext,
  selectedSessionId?: string,
): Promise<OrganizationMembersData> => {
  const sessions = await getSessionsListData(access);
  const members = await buildMemberList(access.organizationId);
  const currentSession =
    sessions.find((session) => session.session_id === selectedSessionId) ??
    sessions.find((session) => session.status === "active") ??
    sessions[0] ??
    null;

  if (!currentSession) {
    return {
      members,
      sessions,
      currentSession: null,
    };
  }

  return {
    members,
    sessions,
    currentSession,
  };
};

export const getPublicSessionExperienceData = async (
  slug: string,
  participantKey: string,
  detectedOperatingSystem: SessionExperienceData["detectedOperatingSystem"],
): Promise<SessionExperienceData> => {
  const supabase = createSupabaseAdminClient();
  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select(sessionColumns)
    .eq("slug", slug)
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const session = sessionRow as Session;
  const [organizationResult, latestSubmissionResult, cohortResult] = await Promise.all([
    getClerkOrganizationSummary(session.organization_id),
    supabase
      .from("latest_session_participants")
      .select(latestParticipantColumns)
      .eq("session_id", session.id)
      .eq("participant_key", participantKey)
      .maybeSingle(),
    supabase
      .from("latest_session_participants")
      .select(latestParticipantColumns)
      .eq("session_id", session.id)
      .limit(1000),
  ]);

  if (latestSubmissionResult.error) {
    throw latestSubmissionResult.error;
  }

  if (cohortResult.error) {
    throw cohortResult.error;
  }

  const latestSubmission = (latestSubmissionResult.data as SessionSubmission | null) ?? null;
  const cohortEntries = (cohortResult.data as SessionSubmission[] | null) ?? [];

  return {
    organization: organizationResult,
    session,
    latestSubmission,
    participantCount: cohortEntries.length,
    sessionAverageMinutes: average(cohortEntries.map((entry) => entry.screen_time_minutes)),
    detectedOperatingSystem,
    participantInsight: buildParticipantInsight(
      latestSubmission,
      cohortEntries,
      session.screen_time_limit_minutes,
    ),
  };
};
