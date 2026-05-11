import Link from "next/link";

import { saveSessionSettingsAction } from "@/app/admin/actions";
import { SessionAgeControls } from "@/components/admin/session-age-controls";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.error === "missing-name") {
    return { type: "error", message: "Nazwa sesji jest wymagana." };
  }

  return null;
};

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flash = getFlashMessage(params);

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Utwórz sesję</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>Ustawienia nowej sesji</h1>
          <p className="wf-page-subtitle">Skonfiguruj nazwę, opis, limit czasu i tryb wieku dla nowej sesji.</p>
        </div>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-stats-grid">
        <form action={saveSessionSettingsAction} className="wf-panel-card wf-form-stack">
          <label className="wf-field">
            <span className="wf-field-label">Nazwa sesji</span>
            <input className="wf-input" defaultValue="Nowa sesja" name="name" type="text" />
          </label>

          <label className="wf-field">
            <span className="wf-field-label">Opis</span>
            <textarea className="wf-textarea" defaultValue="Sesja przygotowana w panelu Wojticore Flowa." name="description" />
          </label>

          <SessionAgeControls defaultAgeMode="variable" defaultFixedAge={18} defaultLimitMinutes={60} />

          <div className="wf-card-actions">
            <button className="wf-btn wf-btn-primary" type="submit">
              Zapisz sesję
            </button>
            <Link className="wf-btn wf-btn-secondary" href="/admin/sessions">
              Anuluj
            </Link>
          </div>
        </form>

        <aside className="wf-panel-card">
          <h3>Co stanie się po zapisaniu?</h3>
          <p>
            Po utworzeniu sesji otrzymasz publiczny link dla uczestników i osobny widok statystyk do monitorowania zgłoszeń.
          </p>
        </aside>
      </div>
    </div>
  );
}