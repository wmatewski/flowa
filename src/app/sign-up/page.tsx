import type { Metadata } from "next";

import { ClerkAuthPage } from "@/components/auth/clerk-auth-page";

export const metadata: Metadata = {
  title: "Rejestracja | Wojticore Flowa",
};

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ClerkAuthPage mode="register" path="/sign-up" searchParams={searchParams} />;
}
