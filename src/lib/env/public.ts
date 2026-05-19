const required = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const recommendedDailyLimitMinutes = Number(
  process.env.NEXT_PUBLIC_RECOMMENDED_DAILY_LIMIT_MINUTES ?? "120",
);

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  projectDomain: process.env.NEXT_PUBLIC_PROJECT_DOMAIN ?? "",
  clerkPublishableKey: required(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  ),
  sessionCookieName:
    process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? "flowa_session_id",
  recommendedDailyLimitMinutes: Number.isNaN(recommendedDailyLimitMinutes)
    ? 120
    : recommendedDailyLimitMinutes,
} as const;