import { redirect } from "next/navigation";

import { findSessionIdByPrefix } from "@/lib/public-session";

export default async function PublicShortLinkPage({
  params,
}: {
  params: Promise<{ short: string }>;
}) {
  const { short } = await params;
  const sessionId = await findSessionIdByPrefix(short);

  if (!sessionId) {
    redirect("/");
  }

  redirect(`/ankieta/${sessionId}`);
}
