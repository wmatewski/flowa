import { redirect } from "next/navigation";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === "mode") {
      continue;
    }

    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }

  const destination = typeof query.mode === "string" && query.mode === "register" ? "/sign-up" : "/login";
  redirect(params.toString() ? `${destination}?${params.toString()}` : destination);
}
