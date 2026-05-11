import type { Database } from "@/lib/database.types";

export type OperatingSystem = Database["flowa"]["Enums"]["os_family"];
export type MembershipRole = Database["flowa"]["Enums"]["membership_role"];
export type MembershipStatus = Database["flowa"]["Enums"]["membership_status"];
export type SessionStatus = Database["flowa"]["Enums"]["session_status"];
export type AgeMode = Database["flowa"]["Enums"]["age_mode"];
export type ResultTone = "optimal" | "warning" | "critical";

export type Profile = Database["flowa"]["Tables"]["profiles"]["Row"];
export type Organization = Database["flowa"]["Tables"]["organizations"]["Row"];
export type Membership = Database["flowa"]["Tables"]["memberships"]["Row"];
export type Session = Database["flowa"]["Tables"]["sessions"]["Row"];
export type SessionCollaborator = Database["flowa"]["Tables"]["session_collaborators"]["Row"];
export type SessionSubmission = Database["flowa"]["Tables"]["session_submissions"]["Row"];
export type ActivityLog = Database["flowa"]["Tables"]["activity_log"]["Row"];
export type SessionOverview = Database["flowa"]["Views"]["session_overview"]["Row"];
export type SessionAgeStatistic = Database["flowa"]["Views"]["session_age_statistics"]["Row"];

export interface FlashMessage {
  type: "success" | "error" | "info";
  message: string;
}

export interface OperatingSystemConfig {
  key: OperatingSystem;
  label: string;
  shortLabel: string;
  headline: string;
  description: string;
  settingsButtonLabel: string;
  settingsHint: string;
  settingsLink: string | null;
  steps: string[];
}

export interface OrganizationMember {
  membershipId: string;
  userId: string | null;
  email: string;
  displayName: string;
  initials: string;
  role: MembershipRole;
  status: MembershipStatus;
  createdAt: string;
}

export interface DashboardMetricSnapshot {
  totalSessions: number;
  totalParticipants: number;
  averageMinutes: number | null;
  sessionTrend: number | null;
  averageTrend: number | null;
}

export interface DashboardActivity {
  id: string;
  title: string;
  description: string | null;
  tag: string;
  createdAt: string;
}

export interface OrganizerDashboardData {
  metrics: DashboardMetricSnapshot;
  sessions: SessionOverview[];
  recentActivities: DashboardActivity[];
  members: OrganizationMember[];
}

export interface FocusScore {
  score: number;
  balancedPercentage: number;
  elevatedPercentage: number;
  criticalPercentage: number;
  label: string;
}

export interface ParticipantInsight {
  tone: ResultTone;
  label: string;
  description: string;
  deltaPercentage: number | null;
  cohortAverageMinutes: number | null;
}

export interface SessionParticipantRow {
  id: string;
  participantKey: string;
  label: string;
  age: number;
  screenTimeMinutes: number;
  statusTone: ResultTone;
  statusLabel: string;
  submittedAt: string;
}

export interface SessionStatisticsData {
  session: Session;
  overview: SessionOverview | null;
  ageStatistics: SessionAgeStatistic[];
  participants: SessionParticipantRow[];
  collaborators: OrganizationMember[];
  focusScore: FocusScore;
}

export interface SessionSettingsData {
  session: Session;
  overview: SessionOverview | null;
  members: OrganizationMember[];
  sessionCollaboratorIds: string[];
}

export interface OrganizationMembersData {
  members: OrganizationMember[];
  sessions: SessionOverview[];
  currentSession: SessionOverview | null;
  sessionCollaborators: OrganizationMember[];
}

export interface SessionExperienceData {
  organization: Organization;
  session: Session;
  latestSubmission: SessionSubmission | null;
  participantCount: number;
  sessionAverageMinutes: number | null;
  detectedOperatingSystem: OperatingSystem;
  participantInsight: ParticipantInsight | null;
}

export interface LiveSessionEntry {
  id: string;
  age: number;
  operatingSystem: OperatingSystem;
  screenTimeMinutes: number;
  submittedAt: string;
}

export interface PublicLiveSessionData {
  session: Session;
  overview: SessionOverview | null;
  entries: LiveSessionEntry[];
}