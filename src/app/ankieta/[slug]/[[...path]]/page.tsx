import { redirect } from "next/navigation";

export default async function AnkietaAliasPage({
  params,
}: {
  params: Promise<{ slug: string; path?: string[] }>;
}) {
  const { slug, path = [] } = await params;
  const suffix = path.length ? `/${path.join("/")}` : "";

  redirect(`/flow/${slug}${suffix}`);
}