import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PublicLiveSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase
    .from<{ id: string }>("sessions")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!session?.id) {
    redirect("/auth");
  }

  const embed = query.embed === "1";
  redirect(`/live/${session.id}${embed ? "?embed=1" : ""}`);
}
