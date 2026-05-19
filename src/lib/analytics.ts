import type {
  FocusScore,
  ParticipantMessageConfig,
  ParticipantInsight,
  ResultTone,
  SessionSubmission,
} from "@/lib/types";
import {
  calculatePercentOverLimit,
  getTimeThresholdRule,
} from "@/lib/time-thresholds";

export const average = (values: number[]) => {
  if (!values.length) {
    return null;
  }

  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
};

export const percentageDelta = (
  currentValue: number | null | undefined,
  previousValue: number | null | undefined,
) => {
  if (
    currentValue == null ||
    previousValue == null ||
    Number.isNaN(currentValue) ||
    Number.isNaN(previousValue) ||
    previousValue === 0
  ) {
    return null;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

export const getParticipantTone = (minutes: number, limitMinutes: number): ResultTone => {
  if (minutes <= limitMinutes) {
    return "optimal";
  }

  if (minutes <= limitMinutes + 60) {
    return "warning";
  }

  return "critical";
};

export const getParticipantStatusLabel = (minutes: number, limitMinutes: number) => {
  const tone = getParticipantTone(minutes, limitMinutes);

  if (tone === "optimal") {
    return "Optymalny";
  }

  if (tone === "warning") {
    return "Ostrzeżenie";
  }

  return "Krytyczny";
};

export const buildFocusScore = (minutesValues: number[], limitMinutes: number): FocusScore => {
  if (!minutesValues.length) {
    return {
      score: 0,
      balancedPercentage: 0,
      elevatedPercentage: 0,
      criticalPercentage: 0,
      label: "Brak danych",
    };
  }

  const balanced = minutesValues.filter((minutes) => minutes <= limitMinutes).length;
  const elevated = minutesValues.filter(
    (minutes) => minutes > limitMinutes && minutes <= limitMinutes + 60,
  ).length;
  const critical = minutesValues.filter((minutes) => minutes > limitMinutes + 60).length;
  const total = minutesValues.length;
  const balancedPercentage = Math.round((balanced / total) * 100);
  const elevatedPercentage = Math.round((elevated / total) * 100);
  const criticalPercentage = Math.round((critical / total) * 100);

  return {
    score: balancedPercentage,
    balancedPercentage,
    elevatedPercentage,
    criticalPercentage,
    label: balancedPercentage >= 65 ? "w normie" : balancedPercentage >= 40 ? "podwyższony" : "wymaga uwagi",
  };
};

export const buildParticipantInsight = (
  latestSubmission: SessionSubmission | null,
  cohortEntries: SessionSubmission[],
  limitMinutes: number,
  customMessages?: ParticipantMessageConfig,
): ParticipantInsight | null => {
  if (!latestSubmission) {
    return null;
  }

  const cohortAverageMinutes = average(
    cohortEntries.map((entry) => entry.screen_time_minutes),
  );
  const deltaPercentage =
    cohortAverageMinutes == null || cohortAverageMinutes === 0
      ? null
      : Math.round(
          ((latestSubmission.screen_time_minutes - cohortAverageMinutes) / cohortAverageMinutes) *
            100,
        );
  const tone = getParticipantTone(latestSubmission.screen_time_minutes, limitMinutes);
  const percentOverLimit = calculatePercentOverLimit(
    latestSubmission.screen_time_minutes,
    limitMinutes,
  );
  const matchedRule = percentOverLimit > 0
    ? getTimeThresholdRule(customMessages?.thresholdRules ?? [], percentOverLimit)
    : null;

  if (tone === "optimal") {
    return {
      tone,
      label: "Świetny wynik",
      description:
        customMessages?.goodTimeMessage ||
        "Twój wynik mieści się w docelowym przedziale tej sesji. Zachowujesz zdrowy poziom obciążenia ekranem.",
      deltaPercentage,
      cohortAverageMinutes,
    };
  }

  if (tone === "warning") {
    return {
      tone,
      label: "Wynik podwyższony",
      description:
        matchedRule?.message ||
        customMessages?.exceededTimeMessage ||
        "Jesteś nieco powyżej celu sesji. Warto zaplanować krótką przerwę i ograniczyć dodatkowe bodźce po spotkaniu.",
      deltaPercentage,
      cohortAverageMinutes,
    };
  }

  return {
    tone,
    label: "Potrzebny reset",
    description:
      matchedRule?.message ||
      customMessages?.exceededTimeMessage ||
      "Twój wynik wyraźnie przekracza limit tej sesji. Najlepiej wprowadzić dłuższy blok offline i wrócić tylko do najważniejszych zadań.",
    deltaPercentage,
    cohortAverageMinutes,
  };
};
