"use client";

import { useSearchParams } from "next/navigation";
import { CreateOrganization, SignIn, SignUp } from "@clerk/nextjs";

const clerkAppearance = {
  variables: {
    colorPrimary: "#005f6e",
    colorText: "#1a1c1e",
    colorBackground: "#ffffff",
    colorNeutral: "#3e484b",
    borderRadius: "4px",
    fontSize: "14px",
  },
  elements: {
    card: {
      boxShadow: "none",
      border: "1px solid #bec8cb",
      borderRadius: "8px",
    },
    formButtonPrimary: {
      backgroundColor: "#005f6e",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "700",
    },
    footerActionLink: {
      color: "#005f6e",
    },
  },
} as const;

interface ClerkAuthFormsProps {
  requiresOrganizationSetup: boolean;
  redirectUrl: string;
}

export function ClerkAuthForms({ requiresOrganizationSetup, redirectUrl }: ClerkAuthFormsProps) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";

  if (requiresOrganizationSetup) {
    return (
      <CreateOrganization
        afterCreateOrganizationUrl={redirectUrl}
        appearance={clerkAppearance}
      />
    );
  }

  if (mode === "register") {
    return (
      <SignUp
        fallbackRedirectUrl={redirectUrl}
        signInUrl={`/auth?redirect_url=${encodeURIComponent(redirectUrl)}`}
        appearance={clerkAppearance}
      />
    );
  }

  return (
    <SignIn
      fallbackRedirectUrl={redirectUrl}
      signUpUrl={`/auth?mode=register&redirect_url=${encodeURIComponent(redirectUrl)}`}
      appearance={clerkAppearance}
    />
  );
}
