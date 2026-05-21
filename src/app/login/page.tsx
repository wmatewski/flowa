import type { Metadata } from "next";

import { ClerkAuthPage } from "@/components/auth/clerk-auth-page";

export const metadata: Metadata = {
  title: "Logowanie | Wojticore Flowa",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ClerkAuthPage mode="login" path="/login" searchParams={searchParams} />;
}
