export default function PublicSessionLoading() {
  return (
    <main className="wf-step-shell">
      <div className="wf-step-container">
        <div className="wf-skeleton wf-skeleton-line" style={{ width: 180 }} />
        <div className="wf-skeleton wf-skeleton-block" style={{ marginTop: 16, width: "100%", height: 52 }} />
        <div className="wf-skeleton wf-skeleton-panel" style={{ marginTop: 20, minHeight: 420 }} />
      </div>
    </main>
  );
}
