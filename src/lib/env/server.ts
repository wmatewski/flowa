import "server-only";

const required = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getNeonDatabaseUrl = () =>
  required(
    process.env.NEON_DATABASE_URL ? "NEON_DATABASE_URL" : "DATABASE_URL",
    process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL,
  );

export const getClerkSecretKey = () =>
  required("CLERK_SECRET_KEY", process.env.CLERK_SECRET_KEY);

