import { redirect } from "next/navigation";

import { findSessionIdBySlug } from "@/lib/public-session";

export default async function FlowLegacyAgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sessionId = await findSessionIdBySlug(slug);

  if (!sessionId) {
    redirect("/");
  }

  redirect(`/ankieta/${sessionId}/age`);
}
