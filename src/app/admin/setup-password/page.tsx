import { redirect } from "next/navigation";

export default async function AdminSetupPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  redirect("/auth?mode=register");
}