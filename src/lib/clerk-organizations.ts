import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import type { Organization } from "@/lib/types";

const toIsoString = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date(0).toISOString();
};

export const getClerkOrganizationSummary = async (organizationId: string): Promise<Organization> => {
  const clerk = await clerkClient();
  const organization = await clerk.organizations.getOrganization({ organizationId });

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug ?? null,
    created_by: null,
    created_at: toIsoString((organization as { createdAt?: unknown }).createdAt),
    updated_at: toIsoString(
      (organization as { updatedAt?: unknown }).updatedAt ?? (organization as { createdAt?: unknown }).createdAt,
    ),
  };
};