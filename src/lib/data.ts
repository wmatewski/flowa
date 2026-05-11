import "server-only";

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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ActivityLog,
  DashboardActivity,
  Membership,
  Organization,
  OrganizationMember,
  OrganizationMembersData,
  OrganizerDashboardData,
  Profile,
  PublicLiveSessionData,
  Session,
  SessionAgeStatistic,
  SessionCollaborator,
  SessionExperienceData,
  LiveSessionEntry,
  SessionOverview,
  SessionParticipantRow,
  SessionSettingsData,
  SessionStatisticsData,
  SessionSubmission,
} from "@/lib/types";
import { redirect } from "next/navigation";

const profileColumns = "user_id, email, display_name, default_organization_id, created_at, updated_at";
const membershipColumns =
  "id, organization_id, user_id, invited_email, role, status, created_by, created_at, updated_at";
const sessionColumns =
  "id, organization_id, slug, name, description, screen_time_limit_minutes, age_mode, fixed_age, status, created_by, starts_at, ends_at, created_at, updated_at";
const sessionOverviewColumns =
  "session_id, organization_id, slug, name, status, screen_time_limit_minutes, created_at, starts_at, ends_at, participant_count, average_minutes, maximum_minutes, latest_submission_at";
const latestParticipantColumns =
  "id, session_id, participant_key, age, screen_time_minutes, detected_os, ip_address, user_agent, submitted_at, entry_date";

const DAY_MS = 24 * 60 * 60 * 1000;

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

const buildMemberList = async (organizationId: string): Promise<OrganizationMember[]> => {
  const supabase = createSupabaseAdminClient();
  const { data: membershipRows, error: membershipError } = await supabase
    .from("memberships")
    .select(membershipColumns)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (membershipError) {
    throw membershipError;
  }

  const memberships = (membershipRows as Membership[] | null) ?? [];
  const userIds = memberships
    .map((membership) => membership.user_id)
    .filter((value): value is string => Boolean(value));

  let profiles: Profile[] = [];

  if (userIds.length) {
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select(profileColumns)
      .in("user_id", userIds);

    if (profileError) {
      throw profileError;
    }

    profiles = (profileRows as Profile[] | null) ?? [];
  }

  const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile]));

  return memberships.map((membership) => {
    const profile = membership.user_id ? profileMap.get(membership.user_id) : null;
    const displayName =
      profile?.display_name?.trim() || membership.invited_email.split("@")[0] || membership.invited_email;

    return {
      membershipId: membership.id,
      userId: membership.user_id,
      email: membership.invited_email,
      displayName,
      initials: formatInitials(displayName),
      role: membership.role,
      status: membership.status,
      createdAt: membership.created_at,
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

  const [sessionResult, overviewResult, ageStatsResult, participantResult, collaboratorResult, members] = await Promise.all([
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
    supabase
      .from("session_collaborators")
      .select("id, session_id, membership_id, role, created_at")
      .eq("session_id", sessionId),
    buildMemberList(access.organizationId),
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

  if (collaboratorResult.error) {
    throw collaboratorResult.error;
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
    submittedAt: entry.submitted_at,
  })) satisfies SessionParticipantRow[];
  const collaboratorIds = new Set(
    ((collaboratorResult.data as SessionCollaborator[] | null) ?? []).map(
      (item) => item.membership_id,
    ),
  );

  return {
    session,
    overview: (overviewResult.data as SessionOverview | null) ?? null,
    ageStatistics: (ageStatsResult.data as SessionAgeStatistic[] | null) ?? [],
    participants,
    collaborators: members.filter((member) => collaboratorIds.has(member.membershipId)),
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

  const [sessionResult, overviewResult, collaboratorResult, members] = await Promise.all([
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
      .from("session_collaborators")
      .select("id, session_id, membership_id, role, created_at")
      .eq("session_id", sessionId),
    buildMemberList(access.organizationId),
  ]);

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (overviewResult.error) {
    throw overviewResult.error;
  }

  if (collaboratorResult.error) {
    throw collaboratorResult.error;
  }

  return {
    session: sessionResult.data as Session,
    overview: (overviewResult.data as SessionOverview | null) ?? null,
    members,
    sessionCollaboratorIds: ((collaboratorResult.data as SessionCollaborator[] | null) ?? []).map(
      (item) => item.membership_id,
    ),
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
      sessionCollaborators: [],
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("session_collaborators")
    .select("id, session_id, membership_id, role, created_at")
    .eq("session_id", currentSession.session_id);

  if (error) {
    throw error;
  }

  const collaboratorIds = new Set(
    ((data as SessionCollaborator[] | null) ?? []).map((item) => item.membership_id),
  );

  return {
    members,
    sessions,
    currentSession,
    sessionCollaborators: members.filter((member) => collaboratorIds.has(member.membershipId)),
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
