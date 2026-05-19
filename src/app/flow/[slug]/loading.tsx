export default function FlowLoading() {
  return (
    <main className="wf-step-shell">
      <div className="wf-step-container">
        <div className="wf-step-topbar">
          <div className="wf-skeleton wf-skeleton-block" style={{ width: 160, height: 24 }} />
          <div className="wf-skeleton wf-skeleton-chip" />
        </div>

        <div className="wf-step-progress">
          <div className="wf-skeleton wf-skeleton-line" style={{ width: 140 }} />
          <div className="wf-skeleton wf-skeleton-block" style={{ marginTop: 12, height: 10, borderRadius: 999 }} />
        </div>

        <section className="wf-step-card">
          <div className="wf-skeleton wf-skeleton-line" style={{ width: 260, height: 32 }} />
          <div className="wf-skeleton wf-skeleton-line" style={{ marginTop: 14, width: "80%" }} />
          <div className="wf-skeleton wf-skeleton-panel" style={{ marginTop: 24, height: 180 }} />
          <div className="wf-skeleton wf-skeleton-block" style={{ marginTop: 24, height: 56 }} />
        </section>
      </div>
    </main>
  );
}