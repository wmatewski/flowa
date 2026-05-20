import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf } from "lucide-react";

import { SessionEntryState } from "@/components/user/session-entry-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicSessionExperienceData } from "@/lib/data";
import { publicEnv } from "@/lib/env/public";
import { detectOperatingSystem } from "@/lib/os";
import type { FlashMessage } from "@/lib/types";

const getFlashMessage = (error: string | undefined): FlashMessage | null => {
  if (error === "invalid-age") {
    return { type: "error", message: "Podaj poprawny wiek w przedziale 1-120." };
  }

  return null;
};

export default async function PublicSessionAgePage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const participantKey = cookieStore.get(publicEnv.sessionCookieName)?.value ?? "";
  const detectedOperatingSystem = detectOperatingSystem(headerStore.get("user-agent"));
  const data = await getPublicSessionExperienceData(sessionId, participantKey, detectedOperatingSystem);

  if (!data.session) {
    redirect("/");
  }

  if (data.latestSubmission) {
    redirect(`/ankieta/${sessionId}/submitted`);
  }

  if (data.session.age_mode !== "variable") {
    redirect(`/ankieta/${sessionId}`);
  }

  const flash = getFlashMessage(query.error ? String(query.error) : undefined);

  return (
    <>
      <main className="wf-step-shell">
        <SessionEntryState sessionId={sessionId} />
        <div className="wf-step-container wf-step-container-animated">
          <div className="wf-step-topbar">
            <Link className="wf-brand" href="/">
              <div className="wf-brand-mark">
                <Leaf size={16} />
              </div>
              <span>{data.organization.name}</span>
            </Link>
            <div className="wf-inline-meta">
              <span>powered by Wojticore Flowa</span>
              <Link className="wf-link-button" href="/guides">
                Pomoc
              </Link>
            </div>
          </div>

          <div className="wf-step-progress">
            <div className="wf-inline-meta" style={{ justifyContent: "space-between" }}>
              <span>Krok 1 z 4</span>
              <span>Wiek</span>
            </div>
            <div className="wf-step-progress-bar">
              <div className="wf-step-progress-fill" style={{ width: "25%" }} />
            </div>
          </div>

          <Card className="wf-step-card wf-step-panel-animated">
            <CardHeader>
              <CardTitle style={{ margin: 0 }}>Podaj swój wiek</CardTitle>
              <CardDescription>Dzięki temu dopasujemy późniejszy wynik do odpowiedniej grupy wiekowej.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

              <form action={`/ankieta/${sessionId}`} className="space-y-5" method="get">
                <div className="space-y-2">
                  <Label htmlFor="age">Wiek uczestnika</Label>
                  <Input
                    id="age"
                    inputMode="numeric"
                    max={120}
                    min={1}
                    name="age"
                    placeholder="25"
                    type="number"
                  />
                </div>

                <Button className="w-full" type="submit">
                  Dalej
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="wf-footer">
        <div className="wf-footer-inner">
          <Link href="/">Made with Wojticore Flowa</Link>
        </div>
      </footer>
    </>
  );
}
