import "server-only";

import { Pool } from "@neondatabase/serverless";

const required = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const connectionString =
  process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

let pool: Pool | null = null;

export const getNeonPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: required(
        process.env.NEON_DATABASE_URL ? "NEON_DATABASE_URL" : "DATABASE_URL",
        connectionString,
      ),
      max: 5,
    });
  }

  return pool;
};
