import { redirect } from "next/navigation";

import { findSessionIdBySlug } from "@/lib/public-session";

export default async function FlowLegacyLivePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const sessionId = await findSessionIdBySlug(slug);

  if (!sessionId) {
    redirect("/");
  }

  const embed = query.embed === "1" ? "?embed=1" : "";
  redirect(`/live/${sessionId}${embed}`);
}
