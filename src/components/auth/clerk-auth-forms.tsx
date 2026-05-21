"use client";

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
  mode: "login" | "register";
  requiresOrganizationSetup: boolean;
  redirectUrl: string;
}

export function ClerkAuthForms({ mode, requiresOrganizationSetup, redirectUrl }: ClerkAuthFormsProps) {
  const authPath = "/auth";

  if (requiresOrganizationSetup) {
    return (
      <CreateOrganization
        key="create-organization"
        path={authPath}
        routing="path"
        afterCreateOrganizationUrl={redirectUrl}
        appearance={clerkAppearance}
      />
    );
  }

  if (mode === "register") {
    return (
      <SignUp
        key="sign-up"
        path={authPath}
        routing="path"
        fallbackRedirectUrl={redirectUrl}
        signInUrl={`${authPath}?mode=login&redirect_url=${encodeURIComponent(redirectUrl)}`}
        appearance={clerkAppearance}
      />
    );
  }

  return (
    <SignIn
      key="sign-in"
      path={authPath}
      routing="path"
      fallbackRedirectUrl={redirectUrl}
      signUpUrl={`${authPath}?mode=register&redirect_url=${encodeURIComponent(redirectUrl)}`}
      appearance={clerkAppearance}
    />
  );
}
