import { ArrowRight, ChartColumn, Code2, Leaf, Presentation } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <header className="wf-topbar">
        <div className="wf-topbar-inner">
          <Link className="wf-brand" href="/">
            <div className="wf-brand-mark">
              <Leaf size={16} />
            </div>
            <span>Wojticore Flowa</span>
          </Link>

          <nav className="wf-nav">
            <Link className="wf-nav-link" href="/admin">
              Dashboard
            </Link>
            <Link className="wf-nav-link" href="/admin/sessions">
              Sesje
            </Link>
            <Link className="wf-nav-link" href="/guides">
              Odkrywaj
            </Link>
          </nav>

          <Link className="wf-btn wf-btn-primary" href="/auth">
            Zaloguj się
          </Link>
        </div>
      </header>

      <main className="wf-public-page">
        <section className="wf-shell wf-hero">
          <div className="wf-hero-copy">
            <div className="wf-badge">Cyfrowe Zdrowie Platforma Open-Source</div>
            <h1>Zadbaj o Zdrowie Cyfrowe Swojej Społeczności</h1>
            <p>
              Organizuj angażujące, interaktywne prezentacje i śledź statystyki czasu przed ekranem w sposób przejrzysty. Flowa to platforma stworzona z myślą o spokoju i efektywności.
            </p>
            <div className="wf-hero-actions">
              <Link className="wf-btn wf-btn-primary" href="/auth?mode=register">
                Rozpocznij teraz
                <ArrowRight size={18} />
              </Link>
              <Link className="wf-btn wf-btn-secondary" href="/guides">
                Dowiedz się więcej
              </Link>
            </div>
          </div>

          <div className="wf-hero-media">
            <Image
              alt="Podgląd pulpitu Wojticore Flowa"
              fill
              sizes="(max-width: 768px) 100vw, 520px"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUa77x_dzhzscRtUoDxS3eAJxiFKbVXzUOO-lTGvDYC01J5LDyUlOV4rP0VqQBdR47MoyKv3XSlEiLAZHX0Q8-aMc5BgOCWLfcefo-yOI1hMvDFzdTHnqeWhqfBqX81v_YuOByRlhab8KCRlWegjqVy_AVmJUwaVjHO0kKYcU3xSkEjMJmcIbB4h8k5MCVKxe4M09NF2i-ouA9RafhROo0de5kwYdVew5LTeNM4tY0Yzuip8GZlSPGhlEhc6dscd5CE0JB-gopa3ux"
            />
            <div className="wf-hero-overlay">
              <div>
                <div style={{ fontWeight: 700 }}>Poziom Skupienia</div>
                <div className="wf-footer-muted">Optymalny</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)" }}>85%</div>
            </div>
          </div>
        </section>

        <section className="wf-feature-section">
          <div className="wf-shell">
            <header style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ margin: 0, fontSize: 40, letterSpacing: "-0.04em" }}>Dlaczego Wojticore Flowa?</h2>
              <p className="wf-page-subtitle" style={{ maxWidth: 720, margin: "12px auto 0" }}>
                Narzędzia zaprojektowane z myślą o minimalizacji cyfrowego stresu i maksymalizacji wartości płynącej ze spotkań.
              </p>
            </header>

            <div className="wf-feature-grid">
              <article className="wf-feature-card">
                <div className="wf-feature-icon">
                  <Presentation size={24} />
                </div>
                <h3>Interaktywne Sesje</h3>
                <p>
                  Twórz prezentacje, które angażują uczestników bez przebodźcowania. Wbudowane narzędzia do ankiet i Q&amp;A działają w tle, nie zakłócając głównego przekazu.
                </p>
              </article>
              <article className="wf-feature-card">
                <div className="wf-feature-icon">
                  <ChartColumn size={24} />
                </div>
                <h3>Dokładne Statystyki</h3>
                <p>
                  Monitoruj czas przed ekranem i poziom zaangażowania za pomocą przejrzystych, łagodnych dla oka wykresów. Analizuj dane, aby budować zdrowsze nawyki cyfrowe.
                </p>
              </article>
              <article className="wf-feature-card">
                <div className="wf-feature-icon" style={{ background: "rgba(108, 248, 187, 0.24)", color: "#006c49" }}>
                  <Code2 size={24} />
                </div>
                <h3>Darmowe i Open-Source</h3>
                <p>
                  Platforma w pełni darmowa, tworzona przez społeczność dla społeczności. Kod źródłowy jest otwarty, co gwarantuje transparentność i bezpieczeństwo Twoich danych.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="wf-footer">
        <div className="wf-footer-inner">
          <div className="wf-brand">
            <div className="wf-brand-mark">
              <Leaf size={16} />
            </div>
            <span>Wojticore Flowa</span>
          </div>
          <div>© 2024 Wojticore Flowa. Wszystkie prawa zastrzeżone.</div>
          <nav className="wf-footer-nav">
            <Link href="/guides">Dokumentacja Open-Source</Link>
            <Link href="/">flowa.wojticore.pl</Link>
            <Link href="/guides">Polityka Prywatności</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
