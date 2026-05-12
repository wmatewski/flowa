"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem, isOperatingSystem } from "@/lib/os";
import { parseParticipantMetadata } from "@/lib/participant-metadata";
import { getClientIp } from "@/lib/request";
import { createSessionId, sessionCookieOptions } from "@/lib/session";

const parseScreenTimeValue = (value: FormDataEntryValue | null) => {
  const rawValue = String(value ?? "")
    .trim()
    .replace(/[^\d:]/g, "");

  if (!rawValue) {
    return null;
  }

  if (rawValue.includes(":")) {
    const [hoursValue, minutesValue] = rawValue.split(":");
    const hours = Number(hoursValue || "0");
    const minutes = Number(minutesValue || "0");

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return { hours, minutes, totalMinutes: hours * 60 + minutes };
  }

  const digits = rawValue.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.length <= 2) {
    const minutes = Number(digits);

    if (Number.isNaN(minutes)) {
      return null;
    }

    return { hours: 0, minutes, totalMinutes: minutes };
  }

  const hours = Number(digits.slice(0, digits.length - 2));
  const minutes = Number(digits.slice(-2));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return { hours, minutes, totalMinutes: hours * 60 + minutes };
};

export const submitSessionEntryAction = async (formData: FormData) => {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const sessionSlug = String(formData.get("sessionSlug") ?? "").trim();
  const age = Number(formData.get("age") ?? "0");
  const requestedOperatingSystem = String(formData.get("operatingSystem") ?? "").trim();
  const parsedTime = parseScreenTimeValue(formData.get("screenTimeValue"));

  if (!sessionId || !sessionSlug) {
    redirect("/");
  }

  if (Number.isNaN(age) || age < 1 || age > 120) {
    redirect(`/flow/${sessionSlug}/age?error=invalid-age`);
  }

  if (
    !parsedTime ||
    parsedTime.hours > 23 ||
    parsedTime.minutes > 59 ||
    parsedTime.totalMinutes < 0 ||
    parsedTime.totalMinutes > 1440
  ) {
    const osQuery = requestedOperatingSystem ? `&os=${requestedOperatingSystem}` : "";
    redirect(`/flow/${sessionSlug}/time?error=invalid-time&age=${age}${osQuery}`);
  }

  const headerStore = await headers();
  const cookieStore = await cookies();
  let participantKey = cookieStore.get(publicEnv.sessionCookieName)?.value;

  if (!participantKey) {
    participantKey = createSessionId();
    cookieStore.set(publicEnv.sessionCookieName, participantKey, sessionCookieOptions);
  }

  const submittedOperatingSystem = String(formData.get("operatingSystem") ?? "").trim();
  const detectedOperatingSystem = detectOperatingSystem(headerStore.get("user-agent"));
  const participantEnteredAt = String(formData.get("participantEnteredAt") ?? "").trim();
  const parsedParticipantEnteredAt = participantEnteredAt ? new Date(participantEnteredAt) : null;
  const operatingSystem =
    submittedOperatingSystem && submittedOperatingSystem !== "unknown" && isOperatingSystem(submittedOperatingSystem)
    ? submittedOperatingSystem
    : detectedOperatingSystem;
  const participantMetadata = parseParticipantMetadata(formData.get("participantMetadata"));

  const supabase = createSupabaseAdminClient();
  const { data: sessionRowRaw, error: sessionError } = await supabase
    .from("sessions")
    .select("id, name, organization_id")
    .eq("id", sessionId)
    .maybeSingle();
  const sessionRow = sessionRowRaw as { id: string; name: string; organization_id: string } | null;

  if (sessionError || !sessionRow) {
    const osQuery = requestedOperatingSystem ? `&os=${requestedOperatingSystem}` : "";
    redirect(`/flow/${sessionSlug}/time?error=save-failed&age=${age}${osQuery}`);
  }

  const { error } = await supabase.from("session_submissions").insert({
    session_id: sessionId,
    participant_key: participantKey,
    age,
    screen_time_minutes: parsedTime.totalMinutes,
    detected_os: operatingSystem,
    ip_address: getClientIp(headerStore),
    entered_at:
      parsedParticipantEnteredAt && !Number.isNaN(parsedParticipantEnteredAt.getTime())
        ? parsedParticipantEnteredAt.toISOString()
        : null,
    client_metadata: participantMetadata ?? {},
    user_agent: headerStore.get("user-agent"),
  });

  if (error) {
    redirect(`/flow/${sessionSlug}/time?error=save-failed&age=${age}&os=${operatingSystem}`);
  }

  await supabase.from("activity_log").insert({
    organization_id: sessionRow.organization_id,
    session_id: sessionRow.id,
    activity_type: "submission_received",
    title: `Nowe zgłoszenie do sesji \"${sessionRow.name}\"`,
    description: `Uczestnik przesłał wynik ${parsedTime.totalMinutes} min.`,
    metadata: {
      age,
      screenTimeMinutes: parsedTime.totalMinutes,
      operatingSystem,
    },
  });

  redirect(`/flow/${sessionSlug}/submitted?saved=1&age=${age}&os=${operatingSystem}`);
};

export const submitScreenTimeAction = submitSessionEntryAction;
