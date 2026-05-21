import { HelpCircle, Laptop, MonitorSmartphone, Smartphone } from "lucide-react";
import Link from "next/link";

export default function GuidesPage() {
  const cards = [
    {
      title: "iOS (iPhone & iPad)",
      description:
        "Otwórz Ustawienia, przejdź do Czasu przed ekranem i wybierz Zobacz całą aktywność.",
      href: "/guides/ios",
      icon: <Smartphone size={24} />,
      steps: [
        "Otwórz aplikację Ustawienia na swoim urządzeniu.",
        "Przewiń w dół i wybierz opcję Czas przed ekranem.",
        "Stuknij Zobacz całą aktywność, aby sprawdzić dzienne i tygodniowe statystyki.",
      ],
    },
    {
      title: "Android",
      description:
        "Wejdź w Cyfrową równowagę i kontrolę rodzicielską, a następnie dotknij wykresu z dzisiejszym czasem.",
      href: "/guides",
      icon: <MonitorSmartphone size={24} />,
      steps: [
        "Wejdź w główne Ustawienia systemu.",
        "Znajdź i wybierz Cyfrowa równowaga i kontrola rodzicielska.",
        "Na głównym pulpicie zobaczysz wykres kołowy z dzisiejszym czasem.",
      ],
    },
    {
      title: "macOS",
      description:
        "Kliknij ikonę Apple, otwórz Ustawienia systemowe i wybierz Czas przed ekranem.",
      href: "/guides",
      icon: <Laptop size={24} />,
      steps: [
        "Kliknij ikonę Apple w lewym górnym rogu ekranu.",
        "Wybierz Ustawienia systemowe.",
        "Wybierz Czas przed ekranem z paska bocznego.",
      ],
    },
    {
      title: "Windows",
      description:
        "Przejdź do Konta i użyj Microsoft Family Safety albo sprawdź aktywność baterii aplikacji.",
      href: "/guides",
      icon: <HelpCircle size={24} />,
      steps: [
        "Naciśnij Start i otwórz Ustawienia.",
        "Przejdź do zakładki Konta.",
        "Wybierz Bezpieczeństwo rodzinne lub sprawdź Zasilanie i bateria.",
      ],
    },
  ];

  return (
    <>
      <header className="wf-topbar">
        <div className="wf-topbar-inner">
          <Link className="wf-brand" href="/">
            <div className="wf-brand-mark">
              <MonitorSmartphone size={16} />
            </div>
            <span>Wojticore Flowa</span>
          </Link>

          <nav className="wf-nav">
            <Link className="wf-nav-link" href="/flow/demo-session">
              Flow
            </Link>
            <Link className="wf-nav-link" href="/admin">
              Insights
            </Link>
            <Link className="wf-nav-link is-active" href="/guides">
              Guides
            </Link>
            <Link className="wf-nav-link" href="/login">
              Profile
            </Link>
          </nav>

          <Link className="wf-btn wf-btn-secondary" href="/login">
            Zaloguj się
          </Link>
        </div>
      </header>

      <main className="wf-public-page">
        <section className="wf-shell">
          <header style={{ maxWidth: 760, marginBottom: 40 }}>
            <h1 className="wf-page-title">Jak sprawdzić czas przed ekranem?</h1>
            <p className="wf-page-subtitle">
              Monitorowanie cyfrowych nawyków to pierwszy krok do odzyskania równowagi. Wybierz platformę, z której korzystasz, aby dowiedzieć się, jak zlokalizować wbudowane narzędzia do śledzenia aktywności.
            </p>
          </header>

          <div className="wf-guide-grid">
            {cards.map((card) => (
              <Link className="wf-guide-card" href={card.href} key={card.title} style={{ padding: 28 }}>
                <div className="wf-guide-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <ol className="wf-steps-list" style={{ marginTop: 8 }}>
                  {card.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
