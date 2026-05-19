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
}

export function ClerkAuthForms({ requiresOrganizationSetup }: ClerkAuthFormsProps) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "register" ? "register" : "login";

  if (requiresOrganizationSetup) {
    return (
      <CreateOrganization
        afterCreateOrganizationUrl="/admin"
        appearance={clerkAppearance}
      />
    );
  }

  if (mode === "register") {
    return (
      <SignUp
        fallbackRedirectUrl="/admin"
        signInUrl="/auth"
        appearance={clerkAppearance}
      />
    );
  }

  return (
    <SignIn
      fallbackRedirectUrl="/admin"
      signUpUrl="/auth?mode=register"
      appearance={clerkAppearance}
    />
  );
}
