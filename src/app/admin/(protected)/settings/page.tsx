import { Settings } from "lucide-react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { saveOrganizationSettingsAction } from "@/app/admin/actions";
import { TimeThresholdRulesEditor } from "@/components/admin/time-threshold-rules-editor";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { normalizeTimeThresholdRules } from "@/lib/time-thresholds";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.saved === "1") {
    return { type: "success", message: "Ustawienia organizacji zostały zapisane." };
  }
  if (params.error === "forbidden") {
    return { type: "error", message: "Brak uprawnień do tej operacji." };
  }
  return null;
};

export default async function OrganizationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/login");
  }

  const query = await searchParams;
  const flash = getFlashMessage(query);

  const clerk = await clerkClient();
  const org = await clerk.organizations.getOrganization({ organizationId: orgId });
  const meta = (org.publicMetadata ?? {}) as {
    defaultGoodTimeMessage?: string | null;
    defaultExceededTimeMessage?: string | null;
    defaultTimeThresholdRules?: unknown;
  };
  const defaultTimeThresholdRules = normalizeTimeThresholdRules(meta.defaultTimeThresholdRules);

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Ustawienia konta</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>Ustawienia organizacji</h1>
          <p className="wf-page-subtitle">Domyślne komunikaty wyświetlane uczestnikom po przesłaniu ankiety.</p>
        </div>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-settings-layout">
        <form action={saveOrganizationSettingsAction} className="wf-settings-form" id="org-settings-form">
          <Card>
            <CardHeader>
              <div className="wf-settings-card-icon">
                <Settings size={22} />
              </div>
              <div>
                <CardTitle>Domyślne komunikaty wyników</CardTitle>
                <CardDescription>
                  Komunikaty widoczne dla uczestnika na stronie potwierdzenia. Możesz nadpisać je w ustawieniach konkretnej ankiety.
                </CardDescription>
              </div>
            </CardHeader>

            <div className="wf-settings-grid">
              <label className="wf-field wf-settings-field-full">
                <span className="wf-field-label">Komunikat dla dobrego wyniku</span>
                <Textarea
                  defaultValue={meta.defaultGoodTimeMessage ?? ""}
                  name="defaultGoodTimeMessage"
                  placeholder="np. Świetnie! Twój wynik mieści się w zalecanym limicie."
                  rows={3}
                />
              </label>

              <label className="wf-field wf-settings-field-full">
                <span className="wf-field-label">Komunikat dla przekroczonego wyniku</span>
                <Textarea
                  defaultValue={meta.defaultExceededTimeMessage ?? ""}
                  name="defaultExceededTimeMessage"
                  placeholder="np. Twój wynik przekracza zalecany limit. Warto zaplanować przerwę."
                  rows={3}
                />
              </label>
            </div>

            <TimeThresholdRulesEditor initialRules={defaultTimeThresholdRules} name="defaultTimeThresholdRules" />

            <div className="wf-card-actions">
              <Button type="submit">
                Zapisz ustawienia
              </Button>
            </div>
          </Card>
        </form>

        <aside className="wf-settings-sidebar">
          <Card>
            <CardHeader>
              <CardTitle>Jak działają komunikaty?</CardTitle>
              <CardDescription>
                Komunikaty są wyświetlane uczestnikom po wysłaniu ankiety na stronie potwierdzenia.
              </CardDescription>
            </CardHeader>
          </Card>
        </aside>
      </div>
    </div>
  );
}
