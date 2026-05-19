import type { TimeThresholdRule } from "@/lib/types";

export const MAX_TIME_THRESHOLD_RULES = 4;

const toInteger = (value: unknown) => {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed);
};

export const normalizeTimeThresholdRules = (value: unknown): TimeThresholdRule[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item == null) {
        return null;
      }

      const minPercent = toInteger((item as { minPercent?: unknown }).minPercent);
      const maxPercent = toInteger((item as { maxPercent?: unknown }).maxPercent);
      const message = String((item as { message?: unknown }).message ?? "").trim();

      if (
        minPercent == null ||
        maxPercent == null ||
        minPercent < 0 ||
        maxPercent < 0 ||
        minPercent > maxPercent ||
        !message
      ) {
        return null;
      }

      return {
        minPercent,
        maxPercent,
        message,
      } satisfies TimeThresholdRule;
    })
    .filter((item): item is TimeThresholdRule => item !== null)
    .slice(0, MAX_TIME_THRESHOLD_RULES);
};

export const parseTimeThresholdRules = (value: FormDataEntryValue | null): TimeThresholdRule[] => {
  if (!value) {
    return [];
  }

  const raw = String(value).trim();

  if (!raw) {
    return [];
  }

  try {
    return normalizeTimeThresholdRules(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const serializeTimeThresholdRules = (rules: TimeThresholdRule[]) =>
  JSON.stringify(rules.slice(0, MAX_TIME_THRESHOLD_RULES));

export const getTimeThresholdRule = (rules: TimeThresholdRule[], percentOverLimit: number) =>
  rules.find(
    (rule) => percentOverLimit >= rule.minPercent && percentOverLimit <= rule.maxPercent,
  ) ?? null;

export const calculatePercentOverLimit = (minutes: number, limitMinutes: number) => {
  if (limitMinutes <= 0 || minutes <= limitMinutes) {
    return 0;
  }

  return Math.round(((minutes - limitMinutes) / limitMinutes) * 100);
};
