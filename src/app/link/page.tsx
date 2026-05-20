import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { pairLiveDisplayAction } from "@/app/link/actions";
import { CopyButton } from "@/components/session/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getClerkOrganizationSummary } from "@/lib/clerk-organizations";
import { getLiveSessionDataById } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { buildLiveDisplayUrl, verifyLiveDisplayToken } from "@/lib/live-display-session";
import { escapeHtmlAttribute } from "@/lib/html";
import { buildSessionShortCode } from "@/lib/public-session";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (params: Record<string, string | string[] | undefined>): FlashMessage | null => {
  if (params.error === "missing-code") {
    return { type: "error", message: "Podaj kod prezentacji." };
  }

  if (params.error === "invalid-code") {
    return { type: "error", message: "Nie znaleziono prezentacji dla tego kodu." };
  }

  if (params.error === "forbidden") {
    return { type: "error", message: "Nie masz uprawnień do tej prezentacji." };
  }

  if (params.error === "not-authorized") {
    return { type: "error", message: "Nie masz aktywnej organizacji lub uprawnień do podglądu." };
  }

  if (params.error === "invalid-token") {
    return { type: "error", message: "Wygenerowany link do podglądu jest nieprawidłowy." };
  }

  return null;
};

export default async function LiveLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  const query = await searchParams;

  if (!userId) {
    redirect("/auth?redirect_url=/link");
  }

  const flash = getFlashMessage(query);
  const baseUrl = publicEnv.appUrl.replace(/\/$/, "");
  const displayToken = typeof query.display_token === "string" ? query.display_token : null;
  const tokenPayload = displayToken ? verifyLiveDisplayToken(displayToken) : null;
  const pairedSessionId = typeof query.sessionId === "string" ? query.sessionId : tokenPayload?.sessionId ?? null;
  const isPaired = Boolean(displayToken && tokenPayload && pairedSessionId === tokenPayload.sessionId);

  const pairedData = isPaired && pairedSessionId ? await getLiveSessionDataById(pairedSessionId) : null;
  const organization = pairedData ? await getClerkOrganizationSummary(pairedData.session.organization_id) : null;
  const liveUrl =
    pairedData && displayToken ? buildLiveDisplayUrl(baseUrl, pairedData.session.id, displayToken) : "";
  const iframeCode =
    pairedData && displayToken
      ? `<iframe src="${escapeHtmlAttribute(liveUrl)}" title="${escapeHtmlAttribute(`${pairedData.session.name} - widok na żywo`)}" width="1280" height="720" style="border:0;width:100%;height:100%"></iframe>`
      : "";

  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel wf-auth-panel-wide">
        <section className="wf-auth-card wf-auth-link-card">
          <div className="wf-auth-header">
            <div className="wf-auth-subtitle">Link</div>
            <h1>{isPaired ? "Połączone urządzenie" : "Połącz widok live"}</h1>
            <p className="wf-page-subtitle" style={{ marginTop: 0 }}>
              {isPaired
                ? "Masz już aktywny token dla konkretnej prezentacji. Możesz go wkleić do Canvy lub otworzyć bezpośrednio."
                : "Wpisz kod prezentacji, aby po zalogowaniu uruchomić osobną sesję tylko do podglądu na żywo."}
            </p>
          </div>

          {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

          {isPaired && pairedData && tokenPayload && organization ? (
            <div className="wf-live-links-grid">
              <article className="wf-panel-card">
                <h3>Sesja podglądu</h3>
                <div className="wf-member-list" style={{ marginTop: 16 }}>
                  <div className="wf-member-row">
                    <span>Organizacja</span>
                    <strong>{organization.name}</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>Prezentacja</span>
                    <strong>{pairedData.session.name}</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>Kod</span>
                    <strong>{buildSessionShortCode(pairedData.session.id)}</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>Urządzenie</span>
                    <strong style={{ textAlign: "right" }}>{tokenPayload.deviceLabel}</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>Adres IP</span>
                    <strong style={{ textAlign: "right" }}>{tokenPayload.ipAddress ?? "Brak danych"}</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>Ważny do</span>
                    <strong style={{ textAlign: "right" }}>{new Date(tokenPayload.expiresAt).toLocaleString("pl-PL")}</strong>
                  </div>
                </div>
              </article>

              <article className="wf-panel-card">
                <h3>Widok osadzony</h3>
                <div className="wf-live-frame-shell" style={{ marginTop: 16 }}>
                  <iframe
                    className="wf-live-frame"
                    src={liveUrl}
                    title={`${pairedData.session.name} - widok na żywo`}
                  />
                </div>
              </article>

              <article className="wf-panel-card wf-live-links-card" style={{ gridColumn: "1 / -1" }}>
                <h3>Kod do Canvy</h3>
                <div className="wf-form-stack" style={{ marginTop: 16 }}>
                  <label className="wf-field">
                    <span className="wf-field-label">Link do podglądu</span>
                    <Input readOnly type="text" value={liveUrl} />
                  </label>
                  <label className="wf-field">
                    <span className="wf-field-label">Gotowy fragment iframe</span>
                    <Textarea className="wf-code-block" readOnly rows={7} style={{ minHeight: 180 }} value={iframeCode} />
                  </label>
                </div>

                <div className="wf-card-actions" style={{ marginTop: 16 }}>
                  <CopyButton className="wf-btn wf-btn-secondary" label="Kopiuj link" value={liveUrl} />
                  <CopyButton className="wf-btn wf-btn-primary" label="Kopiuj fragment" value={iframeCode} />
                </div>
              </article>
            </div>
          ) : (
            <div className="wf-auth-stage">
              <form className="wf-form-stack wf-auth-form wf-auth-stage-panel" action={pairLiveDisplayAction}>
                <label className="wf-field">
                  <span className="wf-field-label">Kod prezentacji</span>
                  <Input autoComplete="off" autoFocus name="code" placeholder="np. abc12" type="text" />
                </label>

                <Button className="wf-btn wf-btn-primary wf-btn-block" type="submit">
                  Połącz widok
                </Button>
              </form>

              <div className="wf-panel-card">
                <h3>Jak to działa</h3>
                <div className="wf-member-list" style={{ marginTop: 16 }}>
                  <div className="wf-member-row">
                    <span>1. Zaloguj się</span>
                    <strong>Potrzebujesz dostępu do organizacji.</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>2. Wpisz kod</span>
                    <strong>Każda prezentacja ma swój krótki kod.</strong>
                  </div>
                  <div className="wf-member-row">
                    <span>3. Skopiuj iframe</span>
                    <strong>Wklej gotowy link do Canvy lub innego embedera.</strong>
                  </div>
                </div>
              </div>

              <div className="wf-panel-card">
                <h3>Powrót</h3>
                <p className="wf-table-muted" style={{ marginBottom: 16 }}>
                  Jeśli chcesz tylko podejrzeć publiczny ekran bez logowania, otwórz stronę live danej prezentacji.
                </p>
                <Link className="wf-link-button" href="/">
                  Wróć na stronę główną
                </Link>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
