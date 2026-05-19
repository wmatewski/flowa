import { Settings } from "lucide-react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { saveOrganizationSettingsAction } from "@/app/admin/actions";
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
    redirect("/auth");
  }

  const query = await searchParams;
  const flash = getFlashMessage(query);

  const clerk = await clerkClient();
  const org = await clerk.organizations.getOrganization({ organizationId: orgId });
  const meta = (org.publicMetadata ?? {}) as {
    defaultGoodTimeMessage?: string | null;
    defaultExceededTimeMessage?: string | null;
  };

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
          <section className="wf-settings-card">
            <div className="wf-settings-card-header">
              <div className="wf-settings-card-icon">
                <Settings size={22} />
              </div>
              <div>
                <h2>Domyślne komunikaty wyników</h2>
                <p>
                  Komunikaty widoczne dla uczestnika na stronie potwierdzenia. Możesz nadpisać je w ustawieniach konkretnej ankiety.
                  Jeśli zostawisz puste, zostaną użyte komunikaty systemowe.
                </p>
              </div>
            </div>

            <div className="wf-settings-grid">
              <label className="wf-field wf-settings-field-full">
                <span className="wf-field-label">Komunikat dla dobrego wyniku (mieszczącego się w limicie)</span>
                <textarea
                  className="wf-textarea"
                  defaultValue={meta.defaultGoodTimeMessage ?? ""}
                  name="defaultGoodTimeMessage"
                  placeholder="np. Świetnie! Twój wynik mieści się w zalecanym limicie."
                  rows={3}
                />
              </label>

              <label className="wf-field wf-settings-field-full">
                <span className="wf-field-label">Komunikat dla przekroczonego wyniku (powyżej limitu)</span>
                <textarea
                  className="wf-textarea"
                  defaultValue={meta.defaultExceededTimeMessage ?? ""}
                  name="defaultExceededTimeMessage"
                  placeholder="np. Twój wynik przekracza zalecany limit. Warto zaplanować przerwę."
                  rows={3}
                />
              </label>
            </div>

            <div className="wf-card-actions">
              <button className="wf-btn wf-btn-primary" type="submit">
                Zapisz ustawienia
              </button>
            </div>
          </section>
        </form>

        <aside className="wf-settings-sidebar">
          <article className="wf-settings-card">
            <h3>Jak działają komunikaty?</h3>
            <p className="wf-table-muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
              Komunikaty są wyświetlane uczestnikom po wysłaniu ankiety na stronie potwierdzenia.
              W ustawieniach każdej ankiety możesz wybrać domyślne komunikaty z tego miejsca lub ustawić własne dla konkretnej sesji.
            </p>
          </article>
        </aside>
      </div>
    </div>
  );
}
