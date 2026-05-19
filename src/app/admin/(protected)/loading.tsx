export default function AdminLoading() {
  return (
    <div className="wf-admin-loading">
      <div className="wf-admin-loading-sidebar">
        <div className="wf-skeleton wf-skeleton-block" style={{ width: 176, height: 32 }} />
        <div className="wf-admin-loading-nav">
          <div className="wf-skeleton wf-skeleton-line" />
          <div className="wf-skeleton wf-skeleton-line" />
          <div className="wf-skeleton wf-skeleton-line" />
          <div className="wf-skeleton wf-skeleton-line" />
        </div>
        <div className="wf-skeleton wf-skeleton-panel" />
      </div>

      <div className="wf-admin-loading-main">
        <div className="wf-admin-loading-header">
          <div>
            <div className="wf-skeleton wf-skeleton-line" style={{ width: 120 }} />
            <div className="wf-skeleton wf-skeleton-block" style={{ marginTop: 14, width: 360, height: 44 }} />
            <div className="wf-skeleton wf-skeleton-line" style={{ marginTop: 12, width: 460 }} />
          </div>
          <div className="wf-admin-loading-actions">
            <div className="wf-skeleton wf-skeleton-chip" />
            <div className="wf-skeleton wf-skeleton-chip" />
          </div>
        </div>

        <div className="wf-admin-loading-grid">
          <div className="wf-skeleton wf-skeleton-panel" />
          <div className="wf-skeleton wf-skeleton-panel" />
          <div className="wf-skeleton wf-skeleton-panel" />
        </div>

        <div className="wf-skeleton wf-skeleton-panel wf-admin-loading-large" />
      </div>
    </div>
  );
}