export default function PublicSessionLoading() {
  return (
    <div className="wf-survey-page">
      <header className="wf-survey-topbar">
        <div className="wf-survey-topbar-slot">
          <div className="wf-skeleton wf-skeleton-circle" style={{ width: 38, height: 38 }} />
        </div>
        <div className="wf-skeleton wf-skeleton-line" style={{ width: 180, height: 18 }} />
        <div className="wf-survey-topbar-slot wf-survey-topbar-slot-end">
          <div className="wf-skeleton wf-skeleton-circle" style={{ width: 38, height: 38 }} />
        </div>
      </header>

      <main className="wf-survey-main">
        <section className="wf-survey-frame">
          <aside className="wf-survey-sidebar">
            <div className="wf-skeleton wf-skeleton-circle" style={{ width: 52, height: 52 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: 180, height: 24 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: "100%", height: 14 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: "88%", height: 14 }} />
          </aside>

          <div className="wf-survey-content">
            <div className="wf-skeleton wf-skeleton-line" style={{ width: 92, height: 14 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: 260, height: 36 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: "100%", height: 14 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: "76%", height: 14 }} />
            <div className="wf-skeleton wf-skeleton-panel" style={{ minHeight: 260 }} />
          </div>
        </section>
      </main>
    </div>
  );
}
