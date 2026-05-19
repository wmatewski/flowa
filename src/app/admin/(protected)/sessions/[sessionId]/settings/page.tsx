import { Clock3, Link2, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { saveSessionMessagesAction, saveSessionSettingsAction } from "@/app/admin/actions";
import { CopyButton } from "@/components/session/copy-button";
import { SlugEditor } from "@/components/admin/slug-editor";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSessionSettingsData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { formatMinutes, formatNumber, formatSessionStatus } from "@/lib/format";
import type { FlashMessage, SessionStatus } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.saved === "1") {
    return { type: "success", message: "Ustawienia sesji zostały zapisane." };
  }

  if (params.created === "1") {
    return { type: "success", message: "Sesja została utworzona. Możesz dopracować jej parametry." };
  }

  if (params.error === "missing-name") {
    return { type: "error", message: "Nazwa sesji jest wymagana." };
  }

  return null;
};

const getStatusTone = (status: SessionStatus) => {
  if (status === "completed") {
    return "optimal";
  }

  if (status === "draft") {
    return "warning";
  }

  return "critical";
};

const getRoleLabel = (role: string) => {
  if (role === "owner") {
    return "Właściciel";
  }

  if (role === "admin") {
    return "Administrator";
  }

  return "Moderator";
};

export default async function SessionSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const flash = getFlashMessage(query);
  const { organization, membership, user } = await getAuthenticatedAdmin();
  const { orgId } = await auth();
  const data = await getSessionSettingsData(
    {
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
    sessionId,
  );
  const baseUrl = publicEnv.appUrl.replace(/\/$/, "");
  const publicUrl = `${baseUrl}/ankieta/${data.session.slug}`;
  const liveUrl = `${baseUrl}/live/${sessionId}`;

  let orgMeta: {
    defaultGoodTimeMessage?: string | null;
    defaultExceededTimeMessage?: string | null;
    sessionMessages?: Record<string, { useCustomMessages?: boolean; goodTimeMessage?: string | null; exceededTimeMessage?: string | null } | undefined>;
  } = {};

  if (orgId) {
    const clerk = await clerkClient();
    const org = await clerk.organizations.getOrganization({ organizationId: orgId });
    orgMeta = (org.publicMetadata ?? {}) as typeof orgMeta;
  }

  const sessionMessagesMeta = orgMeta.sessionMessages?.[sessionId];
  const useCustomMessages = sessionMessagesMeta?.useCustomMessages ?? false;

  return (
    <div className="wf-page">
      <div className="wf-page-header">
        <div>
          <div className="wf-badge">Ustawienia sesji</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>{data.session.name}</h1>
          <p className="wf-page-subtitle">Skonfiguruj parametry ankiety, limity odpowiedzi i zachowaj aktualny dostęp współtwórców.</p>
        </div>

        <div className="wf-card-actions">
          <button className="wf-btn wf-btn-primary" form="session-settings-form" type="submit">
            Zapisz ustawienia
          </button>
        </div>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-hero-preview-grid" style={{ marginBottom: 24 }}>
        <article className="wf-hero-preview-card">
          <span className="wf-table-muted">Status</span>
          <div className={`wf-status-chip ${getStatusTone(data.session.status)}`}>{formatSessionStatus(data.session.status)}</div>
          <span className="wf-table-muted">Publiczna ścieżka: /ankieta/{data.session.slug}</span>
        </article>
        <article className="wf-hero-preview-card">
          <span className="wf-table-muted">Uczestnicy</span>
          <strong className="wf-metric-value" style={{ fontSize: "2.25rem" }}>
            {formatNumber(data.overview?.participant_count)}
          </strong>
          <span className="wf-table-muted">Średni wynik: {formatMinutes(data.overview?.average_minutes)}</span>
        </article>
      </div>

      <div className="wf-settings-layout">
        <form action={saveSessionSettingsAction} className="wf-settings-form" id="session-settings-form">
          <input name="sessionId" type="hidden" value={sessionId} />

          <section className="wf-settings-card">
            <div className="wf-settings-card-header">
              <div className="wf-settings-card-icon">
                <Clock3 size={22} />
              </div>
              <div>
                <h2>Podstawy ankiety</h2>
                <p>Nazwa i opis są widoczne w panelu organizatora oraz pomagają odróżnić badania w obrębie jednej organizacji.</p>
              </div>
            </div>

            <div className="wf-settings-grid">
              <label className="wf-field wf-settings-field-full">
                <span className="wf-field-label">Nazwa sesji</span>
                <input className="wf-input" defaultValue={data.session.name} name="name" type="text" />
                <SlugEditor currentSlug={data.session.slug} sessionName={data.session.name} />
              </label>

              <label className="wf-field wf-settings-field-full">
                <span className="wf-field-label">Opis dla zespołu</span>
                <textarea className="wf-textarea" defaultValue={data.session.description ?? ""} name="description" />
              </label>
            </div>
          </section>

          <section className="wf-settings-card">
            <div className="wf-settings-card-header">
              <div className="wf-settings-card-icon">
                <Link2 size={22} />
              </div>
              <div>
                <h2>Reguły odpowiedzi</h2>
                <p>To ustawienia, które wpływają na przebieg formularza uczestnika i sposób interpretacji wyniku.</p>
              </div>
            </div>

            <div className="wf-settings-grid">
              <label className="wf-field">
                <span className="wf-field-label">Limit czasu przed ekranem (minuty)</span>
                <input
                  className="wf-input"
                  defaultValue={String(data.session.screen_time_limit_minutes)}
                  min="1"
                  name="limitMinutes"
                  type="number"
                />
              </label>

              <label className="wf-field">
                <span className="wf-field-label">Stały wiek</span>
                <input className="wf-input" defaultValue={String(data.session.fixed_age ?? 18)} min="1" name="fixedAge" type="number" />
                <span className="wf-table-muted">Wartość jest używana tylko wtedy, gdy wybierzesz stały wiek dla całej sesji.</span>
              </label>
            </div>

            <div className="wf-settings-radio-grid">
              <label className={`wf-settings-radio${data.session.age_mode === "variable" ? " is-active" : ""}`}>
                <div className="wf-settings-radio-top">
                  <input defaultChecked={data.session.age_mode === "variable"} name="ageMode" type="radio" value="variable" />
                  <div>
                    <strong>Wiek podaje uczestnik</strong>
                    <p className="wf-table-muted">Ankieta rozpoczyna się od pytania o wiek, a wynik pozostaje bardziej kontekstowy.</p>
                  </div>
                </div>
              </label>

              <label className={`wf-settings-radio${data.session.age_mode === "fixed" ? " is-active" : ""}`}>
                <div className="wf-settings-radio-top">
                  <input defaultChecked={data.session.age_mode === "fixed"} name="ageMode" type="radio" value="fixed" />
                  <div>
                    <strong>Stały wiek dla całej sesji</strong>
                    <p className="wf-table-muted">Użyj tej opcji, gdy wszyscy uczestnicy należą do tej samej grupy wiekowej.</p>
                  </div>
                </div>
              </label>
            </div>

            <div className="wf-card-actions">
              <button className="wf-btn wf-btn-primary" type="submit">
                Zapisz zmiany
              </button>
              <Link className="wf-btn wf-btn-secondary" href="/admin/sessions">
                Wróć do listy
              </Link>
            </div>
          </section>
        </form>

        <form action={saveSessionMessagesAction} style={{ display: "contents" }}>
          <input name="sessionId" type="hidden" value={sessionId} />
          <section className="wf-settings-card" style={{ gridColumn: "1" }}>
            <div className="wf-settings-card-header">
              <div className="wf-settings-card-icon">
                <MessageSquare size={22} />
              </div>
              <div>
                <h2>Komunikaty po przesłaniu</h2>
                <p>Wybierz domyślne komunikaty z ustawień organizacji lub ustaw niestandardowe dla tej ankiety.</p>
              </div>
            </div>

            <div className="wf-settings-radio-grid">
              <label className={`wf-settings-radio${!useCustomMessages ? " is-active" : ""}`}>
                <div className="wf-settings-radio-top">
                  <input defaultChecked={!useCustomMessages} name="useCustomMessages" type="radio" value="0" onChange={() => {}} />
                  <div>
                    <strong>Domyślne z ustawień konta</strong>
                    <p className="wf-table-muted">Używaj komunikatów ustawionych globalnie dla organizacji.</p>
                  </div>
                </div>
              </label>
              <label className={`wf-settings-radio${useCustomMessages ? " is-active" : ""}`}>
                <div className="wf-settings-radio-top">
                  <input defaultChecked={useCustomMessages} name="useCustomMessages" type="radio" value="1" onChange={() => {}} />
                  <div>
                    <strong>Niestandardowe dla tej ankiety</strong>
                    <p className="wf-table-muted">Wpisz własne komunikaty widoczne tylko w tej sesji.</p>
                  </div>
                </div>
              </label>
            </div>

            {useCustomMessages ? (
              <div className="wf-settings-grid" style={{ marginTop: 16 }}>
                <label className="wf-field wf-settings-field-full">
                  <span className="wf-field-label">Komunikat dla dobrego wyniku</span>
                  <textarea
                    className="wf-textarea"
                    defaultValue={sessionMessagesMeta?.goodTimeMessage ?? ""}
                    name="goodTimeMessage"
                    placeholder="np. Świetnie! Twój wynik mieści się w zalecanym limicie."
                    rows={3}
                  />
                </label>
                <label className="wf-field wf-settings-field-full">
                  <span className="wf-field-label">Komunikat dla przekroczonego wyniku</span>
                  <textarea
                    className="wf-textarea"
                    defaultValue={sessionMessagesMeta?.exceededTimeMessage ?? ""}
                    name="exceededTimeMessage"
                    placeholder="np. Twój wynik przekracza zalecany limit."
                    rows={3}
                  />
                </label>
              </div>
            ) : (
              <div className="wf-settings-grid" style={{ marginTop: 16 }}>
                <label className="wf-field wf-settings-field-full">
                  <span className="wf-field-label">Komunikat dla dobrego wyniku (podgląd domyślnego)</span>
                  <textarea
                    className="wf-textarea"
                    disabled
                    name="goodTimeMessage"
                    rows={3}
                    value={orgMeta.defaultGoodTimeMessage ?? "Twój wynik mieści się w docelowym przedziale tej sesji. Zachowujesz zdrowy poziom obciążenia ekranem."}
                    readOnly
                  />
                </label>
                <label className="wf-field wf-settings-field-full">
                  <span className="wf-field-label">Komunikat dla przekroczonego wyniku (podgląd domyślnego)</span>
                  <textarea
                    className="wf-textarea"
                    disabled
                    name="exceededTimeMessage"
                    rows={3}
                    value={orgMeta.defaultExceededTimeMessage ?? "Jesteś powyżej celu sesji. Warto zaplanować krótką przerwę."}
                    readOnly
                  />
                </label>
              </div>
            )}

            <div className="wf-card-actions" style={{ marginTop: 16 }}>
              <button className="wf-btn wf-btn-primary" type="submit">
                Zapisz komunikaty
              </button>
              <Link className="wf-btn wf-btn-secondary" href="/admin/settings">
                Edytuj domyślne
              </Link>
            </div>
          </section>
        </form>

        <aside className="wf-settings-sidebar">
          <article className="wf-settings-card">
            <div className="wf-settings-card-header">
              <div className="wf-settings-card-icon">
                <Users size={22} />
              </div>
              <div>
                <h2>Podsumowanie</h2>
                <p>Najważniejsze informacje o ankiecie i szybkie skróty do udostępniania.</p>
              </div>
            </div>

            <div className="wf-settings-list">
              <div className="wf-settings-list-row">
                <span className="wf-table-muted">Status</span>
                <strong>{formatSessionStatus(data.session.status)}</strong>
              </div>
              <div className="wf-settings-list-row">
                <span className="wf-table-muted">Dostęp organizacji</span>
                <strong>Clerk</strong>
              </div>
              <div className="wf-settings-list-row">
                <span className="wf-table-muted">Uczestnicy</span>
                <strong>{formatNumber(data.overview?.participant_count)}</strong>
              </div>
              <div className="wf-settings-list-row">
                <span className="wf-table-muted">Średni wynik</span>
                <strong>{formatMinutes(data.overview?.average_minutes)}</strong>
              </div>
            </div>

            <label className="wf-field">
              <span className="wf-field-label">Link do ankiety</span>
              <input className="wf-input" readOnly type="text" value={publicUrl} />
            </label>

            <label className="wf-field">
              <span className="wf-field-label">Widok live</span>
              <input className="wf-input" readOnly type="text" value={liveUrl} />
            </label>

            <div className="wf-card-actions">
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj ankietę" value={publicUrl} />
              <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj live" value={liveUrl} />
            </div>
          </article>

          <article className="wf-settings-card">
            <div className="wf-settings-card-header">
              <div className="wf-settings-card-icon">
                <Users size={22} />
              </div>
              <div>
                <h2>Dostęp organizacji</h2>
                <p>Dostęp do ankiet i zaproszenia są zarządzane przez Clerk na poziomie organizacji.</p>
              </div>
            </div>

            <p className="wf-empty">
              Ta ankieta korzysta z członków aktywnej organizacji w Clerk, bez lokalnej listy przypisań.
            </p>

            <div className="wf-card-actions">
              <Link className="wf-btn wf-btn-secondary wf-btn-block" href="/admin/organization">
                Zarządzaj organizacją
              </Link>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}