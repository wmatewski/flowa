export default function AuthLoading() {
  return (
    <main className="wf-auth-layout">
      <section className="wf-auth-panel">
        <section className="wf-auth-card wf-auth-loading-shell">
          <div className="wf-auth-loading-stack">
            <div className="wf-skeleton wf-skeleton-line" style={{ width: 120 }} />
            <div className="wf-skeleton wf-skeleton-block" style={{ width: 260, height: 44 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: "88%" }} />
            <div className="wf-skeleton wf-skeleton-panel" style={{ height: 260 }} />
          </div>
        </section>
      </section>
    </main>
  );
}