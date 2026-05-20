import Link from "next/link";

import { saveSessionSettingsAction } from "@/app/admin/actions";
import { SessionAgeControls } from "@/components/admin/session-age-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
          <p className="wf-page-subtitle">Skonfiguruj nazwę, opis, limit czasu i wiek dla nowej sesji.</p>
        </div>
      </div>

      {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

      <div className="wf-stats-grid">
        <Card className="wf-form-stack">
          <form action={saveSessionSettingsAction}>
            <CardContent className="wf-form-stack">
              <label className="wf-field">
                <span className="wf-field-label">Nazwa sesji</span>
                <Input defaultValue="Nowa sesja" name="name" type="text" />
              </label>

              <label className="wf-field">
                <span className="wf-field-label">Opis</span>
                <Textarea defaultValue="Sesja przygotowana w panelu Wojticore Flowa." name="description" />
              </label>

              <SessionAgeControls defaultAgeMode="variable" defaultFixedAge={18} defaultLimitMinutes={60} />

              <div className="wf-card-actions">
                <Button type="submit">Zapisz sesję</Button>
                <Button asChild variant="secondary">
                  <Link href="/admin/sessions">Anuluj</Link>
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Co stanie się po zapisaniu?</CardTitle>
            <CardDescription>Po utworzeniu sesji od razu dostaniesz link dla uczestników i widok wyników.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
