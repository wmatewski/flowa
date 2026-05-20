import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { PublicOperatingSystemStep } from "@/components/user/public-operating-system-step";
import { SessionEntryState } from "@/components/user/session-entry-state";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, isOperatingSystem } from "@/lib/os";
import type { OperatingSystem } from "@/lib/types";

const getAvailableOperatingSystems = (detectedOperatingSystem: OperatingSystem) => {
  if (detectedOperatingSystem === "ios" || detectedOperatingSystem === "android") {
    return ["ios", "android"] as OperatingSystem[];
  }

  return ["windows", "macos", "linux"] as OperatingSystem[];
};

export default async function PublicSessionInstructionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const participantKey = cookieStore.get(publicEnv.sessionCookieName)?.value ?? "";
  const detectedOperatingSystem = detectOperatingSystem(headerStore.get("user-agent"));
  const data = await getPublicSessionExperienceData(sessionId, participantKey, detectedOperatingSystem);
  const requestedAge = query.age ? Number(query.age) : null;
  const age = data.session.age_mode === "fixed" ? data.session.fixed_age : requestedAge;

  if (data.latestSubmission) {
    redirect(`/ankieta/${sessionId}/submitted`);
  }

  if (!age) {
    redirect(`/ankieta/${sessionId}/age`);
  }

  const availableOperatingSystems = getAvailableOperatingSystems(detectedOperatingSystem);
  const selectedOperatingSystem =
    typeof query.os === "string" &&
    isOperatingSystem(query.os) &&
    availableOperatingSystems.includes(query.os)
      ? query.os
      : "unknown";

  return (
    <>
      <SessionEntryState sessionId={sessionId} />
      <PublicOperatingSystemStep
        age={age}
        ageMode={data.session.age_mode}
        availableOperatingSystems={availableOperatingSystems}
        initialOperatingSystem={selectedOperatingSystem}
        organizationName={data.organization.name}
        sessionId={sessionId}
        sessionName={data.session.name}
      />
    </>
  );
}
