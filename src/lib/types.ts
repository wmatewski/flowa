import type { Database } from "@/lib/database.types";

export type OperatingSystem = Database["public"]["Enums"]["os_family"];
export type MembershipRole = Database["public"]["Enums"]["membership_role"];
export type MembershipStatus = Database["public"]["Enums"]["membership_status"];
export type SessionStatus = Database["public"]["Enums"]["session_status"];
export type AgeMode = Database["public"]["Enums"]["age_mode"];
export type ResultTone = "optimal" | "warning" | "critical";
export type OrganizationRole = MembershipRole;
export type OrganizationMemberStatus = MembershipStatus;

export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionSubmission = Database["public"]["Tables"]["session_submissions"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];
export type SessionOverview = Database["public"]["Views"]["session_overview"]["Row"];
export type SessionAgeStatistic = Database["public"]["Views"]["session_age_statistics"]["Row"];

export interface Profile {
  userId: string;
  email: string;
  displayName: string;
  defaultOrganizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  membershipId: string;
  organizationId: string;
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
  publicMetadata?: Record<string, unknown>;
}

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
  id: string;
  membershipId: string;
  userId: string;
  email: string;
  displayName: string;
  initials: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  createdAt: string;
}

export type SessionCollaborator = OrganizationMember;

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

export interface ParticipantClientMetadata {
  deviceTypeLabel: string | null;
  operatingSystemLabel: string | null;
  browserLabel: string | null;
  browserLanguages: string | null;
  screenDetails: string | null;
  viewportDetails: string | null;
  orientation: string | null;
  browserLanguage: string | null;
  timezone: string | null;
  userLocalTime: string | null;
  platform: string | null;
  referrer: string | null;
  fullUserAgent: string | null;
  memoryLabel: string | null;
  cpuCores: number | null;
  touchScreen: boolean | null;
  cookiesEnabled: boolean | null;
  networkType: string | null;
  networkRttMs: number | null;
  networkDownlinkMbps: number | null;
  networkSaveData: boolean | null;
  webglGpu: string | null;
  fontCount: number | null;
  pluginsCount: number | null;
  webdriverDetected: boolean | null;
}

export interface SessionParticipantRow {
  id: string;
  participantKey: string;
  label: string;
  age: number;
  screenTimeMinutes: number;
  statusTone: ResultTone;
  statusLabel: string;
  detectedOperatingSystem: OperatingSystem;
  enteredAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  clientMetadata: ParticipantClientMetadata | null;
  submittedAt: string;
}

export interface SessionStatisticsData {
  session: Session;
  overview: SessionOverview | null;
  ageStatistics: SessionAgeStatistic[];
  participants: SessionParticipantRow[];
  focusScore: FocusScore;
}

export interface SessionSettingsData {
  session: Session;
  overview: SessionOverview | null;
}

export interface OrganizationMembersData {
  members: OrganizationMember[];
  sessions: SessionOverview[];
  currentSession: SessionOverview | null;
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
