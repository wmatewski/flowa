import { BarChart3, Check, Hourglass, Settings } from "lucide-react";

const steps = [
  {
    index: "1",
    icon: <Settings size={20} />,
    title: "Ustawienia",
    description: "Otwórz główną aplikację Ustawienia na ekranie początkowym swojego iPhone'a.",
    complete: false,
  },
  {
    index: "2",
    icon: <Hourglass size={20} />,
    title: "Czas przed ekranem",
    description: "Przewiń w dół i stuknij w opcję Czas przed ekranem (ikona fioletowej klepsydry).",
    complete: false,
  },
  {
    index: "",
    icon: <BarChart3 size={20} />,
    title: "Zobacz całą aktywność",
    description: "Wybierz Zobacz całą aktywność pod wykresem, aby przeanalizować szczegóły dzienne i tygodniowe.",
    complete: true,
  },
];

export default function IosGuidePage() {
  return (
    <main className="wf-public-page">
      <section className="wf-shell" style={{ maxWidth: 680 }}>
        <div className="wf-badge" style={{ marginBottom: 16 }}>Poradnik iOS</div>
        <h1 className="wf-page-title">Jak sprawdzić czas</h1>
        <p className="wf-page-subtitle" style={{ marginBottom: 32 }}>
          Świadomość to pierwszy krok do lepszego skupienia. Zobacz, jak łatwo sprawdzić swoje nawyki w systemie iOS.
        </p>

        <div className="wf-timeline">
          {steps.map((step) => (
            <div className="wf-timeline-item" key={step.title}>
              <div className="wf-timeline-index">
                <div className={`wf-timeline-index-inner${step.complete ? " done" : ""}`}>
                  {step.complete ? <Check size={18} /> : step.index}
                </div>
              </div>
              <div className="wf-timeline-card">
                <div className="wf-inline-meta" style={{ color: "var(--text)", fontWeight: 700, marginBottom: 8 }}>
                  <span className="wf-guide-icon" style={{ width: 40, height: 40 }}>{step.icon}</span>
                  <span>{step.title}</span>
                </div>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}