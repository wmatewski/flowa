import { redirect } from "next/navigation";
import { OrganizationProfile } from "@clerk/nextjs";

import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export default async function OrganizationPage() {
  const { organization, membership } = await getAuthenticatedAdmin();

  if (membership.role === "moderator") {
    redirect("/admin/sessions?error=forbidden");
  }

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <h1 className="wf-page-title">{organization.name}</h1>
        </div>
      </div>

      <OrganizationProfile
        routing="hash"
        appearance={{
          variables: {
            colorPrimary: "#005f6e",
            colorText: "#1a1c1e",
            colorBackground: "#ffffff",
            colorNeutral: "#3e484b",
            borderRadius: "4px",
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
              fontWeight: "700",
            },
            rootBox: {
              width: "100%",
            },
          },
        }}
      />
    </div>
  );
}
