import Link from "next/link";
import { redirect } from "next/navigation";

import { SessionEntryState } from "@/components/user/session-entry-state";
import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FlashMessage } from "@/lib/types";

type SessionAgeRow = Pick<Database["public"]["Tables"]["sessions"]["Row"], "id" | "slug" | "age_mode">;

const getFlashMessage = (error: string | undefined): FlashMessage | null => {
  if (error === "invalid-age") {
    return { type: "error", message: "Podaj poprawny wiek w przedziale 1-120." };
  }

  return null;
};

export default async function FlowAgePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase
    .from<SessionAgeRow>("sessions")
    .select("id, slug, age_mode")
    .eq("slug", slug)
    .maybeSingle();

  if (!session) {
    redirect("/");
  }

  if (session.age_mode !== "variable") {
    redirect(`/flow/${slug}`);
  }

  const flash = getFlashMessage(query.error ? String(query.error) : undefined);

  return (
    <main className="wf-step-shell">
      <SessionEntryState sessionSlug={slug} />
      <div className="wf-step-container">
        <div className="wf-step-topbar">
          <Link className="wf-brand" href="/">
            <span>Wojticore Flowa</span>
          </Link>
          <Link className="wf-link-button" href="/guides">
            Pomoc
          </Link>
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

        <section className="wf-step-card">
          <div>
            <h1 className="wf-step-title">Podaj swój wiek</h1>
            <p className="wf-step-description">Dzięki temu dopasujemy późniejszy wynik do odpowiedniej grupy wiekowej.</p>
          </div>

          {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

          <form action={`/flow/${slug}`} className="wf-form-stack" method="get">
            <label className="wf-field">
              <span className="wf-field-label">Wiek uczestnika</span>
              <input
                className="wf-time-input wf-step-time-input"
                inputMode="numeric"
                max="120"
                min="1"
                name="age"
                placeholder="25"
                type="number"
              />
            </label>

            <button className="wf-btn wf-btn-primary wf-btn-block wf-btn-large" type="submit">
              Dalej
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
