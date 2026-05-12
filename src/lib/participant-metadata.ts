import type { ParticipantClientMetadata } from "@/lib/types";

const MAX_CPU_CORES = 256;
const MAX_FONT_COUNT = 100000;
const MAX_PLUGIN_COUNT = 10000;

const toRecord = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const toStringValue = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized ? normalized.slice(0, maxLength) : null;
};

const toNumberValue = (value: unknown, minimum: number, maximum: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value < minimum || value > maximum) {
    return null;
  }

  return value;
};

const toBooleanValue = (value: unknown) => (typeof value === "boolean" ? value : null);

const hasAnyValidMetadata = (metadata: ParticipantClientMetadata) =>
  Object.values(metadata).some((item) => item !== null);

export const normalizeParticipantMetadata = (value: unknown): ParticipantClientMetadata | null => {
  const record = toRecord(value);

  if (!record) {
    return null;
  }

  const metadata: ParticipantClientMetadata = {
    deviceTypeLabel: toStringValue(record.deviceTypeLabel, 32),
    operatingSystemLabel: toStringValue(record.operatingSystemLabel, 80),
    browserLabel: toStringValue(record.browserLabel, 80),
    screenDetails: toStringValue(record.screenDetails, 120),
    orientation: toStringValue(record.orientation, 64),
    browserLanguage: toStringValue(record.browserLanguage, 32),
    timezone: toStringValue(record.timezone, 64),
    userLocalTime: toStringValue(record.userLocalTime, 80),
    platform: toStringValue(record.platform, 64),
    fullUserAgent: toStringValue(record.fullUserAgent, 1024),
    memoryLabel: toStringValue(record.memoryLabel, 32),
    cpuCores: toNumberValue(record.cpuCores, 1, MAX_CPU_CORES),
    touchScreen: toBooleanValue(record.touchScreen),
    cookiesEnabled: toBooleanValue(record.cookiesEnabled),
    webglGpu: toStringValue(record.webglGpu, 256),
    fontCount: toNumberValue(record.fontCount, 0, MAX_FONT_COUNT),
    pluginsCount: toNumberValue(record.pluginsCount, 0, MAX_PLUGIN_COUNT),
    webdriverDetected: toBooleanValue(record.webdriverDetected),
  };

  return hasAnyValidMetadata(metadata) ? metadata : null;
};

export const parseParticipantMetadata = (value: FormDataEntryValue | null | undefined) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return normalizeParticipantMetadata(JSON.parse(value));
  } catch {
    return null;
  }
};
