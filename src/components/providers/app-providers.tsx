"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export const AppProviders = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const pathname = usePathname();

  if (pathname.startsWith("/live/")) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
};
