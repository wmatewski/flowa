import { redirect } from "next/navigation";

import type { Database } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FlashMessage } from "@/lib/types";

type SessionAgeRow = Pick<Database["flowa"]["Tables"]["sessions"]["Row"], "id" | "slug" | "age_mode">;

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
    <main className="wf-age-shell">
      <div className="wf-age-card">
        <div>
          <h1>Podaj swój wiek</h1>
          <p>Abyśmy mogli spersonalizować Twoje doświadczenie w aplikacji.</p>
        </div>

        {flash ? <div className={`wf-flash ${flash.type}`}>{flash.message}</div> : null}

        <form action={`/flow/${slug}`} className="wf-form-stack" method="get">
          <label className="wf-age-input-wrap">
            <input
              className="wf-time-input wf-age-input"
              inputMode="numeric"
              max="120"
              min="1"
              name="age"
              placeholder="25"
              type="number"
            />
            <span className="wf-age-input-suffix">lat</span>
          </label>

          <button className="wf-btn wf-btn-primary wf-btn-block wf-btn-large" type="submit">
            Dalej
          </button>
        </form>
      </div>
    </main>
  );
}