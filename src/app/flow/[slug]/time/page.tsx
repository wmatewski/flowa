import { redirect } from "next/navigation";

import { findSessionIdBySlug } from "@/lib/public-session";

export default async function FlowLegacyTimePage({
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

  const age = typeof query.age === "string" ? `?age=${encodeURIComponent(query.age)}` : "";
  const os = typeof query.os === "string" ? `${age ? "&" : "?"}os=${encodeURIComponent(query.os)}` : "";

  redirect(`/ankieta/${sessionId}/time${age}${os}`);
}
