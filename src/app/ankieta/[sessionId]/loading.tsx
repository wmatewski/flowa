export default function PublicSessionLoading() {
  return (
    <main className="wf-step-shell">
      <div className="wf-step-container">
        <div className="wf-step-topbar">
          <div className="wf-skeleton wf-skeleton-line" style={{ width: 180, height: 18 }} />
          <div className="wf-skeleton wf-skeleton-line" style={{ width: 140, height: 16 }} />
        </div>
        <div className="wf-step-progress">
          <div className="wf-inline-meta" style={{ justifyContent: "space-between" }}>
            <div className="wf-skeleton wf-skeleton-line" style={{ width: 120, height: 14 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ width: 120, height: 14 }} />
          </div>
          <div className="wf-step-progress-bar">
            <div className="wf-step-progress-fill" style={{ width: "50%" }} />
          </div>
        </div>
        <div className="wf-skeleton wf-skeleton-panel" style={{ minHeight: 420 }} />
      </div>
      <footer className="wf-footer">
        <div className="wf-footer-inner">
          <span>Made with Wojticore Flowa</span>
        </div>
      </footer>
    </main>
  );
}
