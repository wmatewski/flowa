export const formatMinutes = (minutes: number | null | undefined) => {
  if (minutes == null || Number.isNaN(minutes)) {
    return "Brak danych";
  }

  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (!hours) {
    return `${remainingMinutes} min`;
  }

  if (!remainingMinutes) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const LIVE_TIME_ZONE = "Europe/Warsaw";

const buildDateKey = (value: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: LIVE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));

const formatLiveClock = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: LIVE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));

const formatLiveDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: LIVE_TIME_ZONE,
    dateStyle: "medium",
  }).format(new Date(value));

export const formatLiveTimestamp = (value: string) => {
  const submittedAt = new Date(value);

  if (Number.isNaN(submittedAt.getTime())) {
    return "Brak danych";
  }

  const currentKey = buildDateKey(new Date().toISOString());
  const submittedKey = buildDateKey(value);
  const time = formatLiveClock(value);

  if (currentKey === submittedKey) {
    return `${time}, Dzisiaj`;
  }

  return `${time}, ${formatLiveDate(value)}`;
};

export const formatDateTimeWithSeconds = (value: string | null | undefined) => {
  if (!value) {
    return "Brak danych";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
};

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
  }).format(new Date(value));

export const formatNumber = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("pl-PL").format(value);
};

export const formatRelativeDate = (value: string) => {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.round((now - date) / (1000 * 60));

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)} min temu`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} godz. temu`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays === 1) {
    return "Wczoraj";
  }

  return `${diffDays} dni temu`;
};

export const formatPercentage = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return "Brak danych";
  }

  if (value > 0) {
    return `+${value}%`;
  }

  return `${value}%`;
};

export const formatMembershipRole = (role: string) => {
  if (role === "owner") {
    return "Właściciel";
  }

  if (role === "admin") {
    return "Administrator";
  }

  return "Moderator";
};

export const formatRole = formatMembershipRole;

export const formatMembershipStatus = (status: string) => {
  if (status === "active") {
    return "Aktywny";
  }

  if (status === "invited") {
    return "Zaproszony";
  }

  return "Wyłączony";
};

export const formatStatus = formatMembershipStatus;

export const formatSessionStatus = (status: string) => {
  if (status === "active") {
    return "Aktywna";
  }

  if (status === "completed") {
    return "Zakończona";
  }

  return "Szkic";
};

export const formatInitials = (value: string) => {
  const parts = value
    .replace(/@.*$/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "WF";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
};
