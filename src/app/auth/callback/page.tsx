"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function AuthCallbackPage() {
  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        <section className="wf-auth-card wf-auth-loading-shell">
          <div className="wf-auth-header">
            <div className="wf-auth-subtitle">Logowanie</div>
            <h1>Kończymy logowanie</h1>
            <p className="wf-page-subtitle" style={{ marginTop: 0 }}>
              Zaczekaj chwilę. Finalizujemy autoryzację przez Google.
            </p>
          </div>

          <AuthenticateWithRedirectCallback />
        </section>
      </section>
    </main>
  );
}