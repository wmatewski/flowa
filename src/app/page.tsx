import {
  ArrowRight,
  ChartColumn,
  Code2,
  Leaf,
  Presentation,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

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
            <Link className="wf-nav-link" href="#funkcje">
              Funkcje
            </Link>
            <Link className="wf-nav-link" href="/guides">
              Poradniki
            </Link>
            {isSignedIn ? (
              <Link className="wf-nav-link" href="/admin">
                Dashboard
              </Link>
            ) : null}
          </nav>

          <div className="wf-card-actions">
            {isSignedIn ? (
              <Link className="wf-btn wf-btn-primary" href="/admin">
                Dashboard
              </Link>
            ) : (
              <>
                <Link className="wf-btn wf-btn-secondary" href="/auth?mode=login">
                  Zaloguj się
                </Link>
                <Link className="wf-btn wf-btn-primary" href="/auth?mode=register">
                  Zarejestruj
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="wf-public-page">
        <section className="wf-shell wf-hero">
          <div className="wf-hero-copy">
            <div className="wf-badge">NASZA ORGANIZACJA</div>
            <h1>Wojticore Flowa</h1>
            <p>
              Interaktywne ankiety o czasie przed ekranem na żywo w Twojej prezentacji.
            </p>
            <div className="wf-hero-actions">
              <Button asChild className="wf-hero-primary-link">
                <Link href={isSignedIn ? "/admin" : "/auth?mode=register"}>
                  {isSignedIn ? "Dashboard" : "Zacznij"}
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <a className="wf-btn wf-btn-secondary" href="https://github.com" rel="noreferrer" target="_blank">
                Zobacz na GitHubie
              </a>
            </div>
          </div>

          <div className="wf-hero-visual">
            <div className="wf-hero-visual-card">
              <div className="wf-hero-visual-accent wf-hero-visual-accent-top" />
              <div className="wf-hero-visual-accent wf-hero-visual-accent-bottom" />
              <div className="wf-hero-visual-monitor">
                <div className="wf-hero-visual-monitor-topbar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="wf-hero-visual-monitor-screen">
                  <div className="wf-hero-visual-chart">
                    <div className="wf-hero-visual-bars">
                      <span style={{ height: "38%" }} />
                      <span style={{ height: "54%" }} />
                      <span style={{ height: "76%" }} />
                      <span style={{ height: "63%" }} />
                      <span style={{ height: "88%" }} />
                    </div>
                    <div className="wf-hero-visual-rings">
                      <div className="wf-hero-visual-ring" />
                      <div className="wf-hero-visual-ring" />
                      <div className="wf-hero-visual-ring" />
                    </div>
                  </div>
                </div>
                <div className="wf-hero-visual-dock">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="wf-hero-visual-floating wf-hero-visual-floating-left">
                <ChartColumn size={18} />
              </div>
              <div className="wf-hero-visual-floating wf-hero-visual-floating-right">
                <Radio size={18} />
              </div>
            </div>
          </div>
        </section>

        <section className="wf-feature-section" id="funkcje">
          <div className="wf-shell">
            <header style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ margin: 0, fontSize: 40, letterSpacing: "-0.04em" }}>Dlaczego Wojticore Flowa?</h2>
              <p className="wf-page-subtitle" style={{ maxWidth: 720, margin: "12px auto 0" }}>
                Zaprojektowane dla spokojnej prezentacji, szybkiego startu i czytelnych wyników.
              </p>
            </header>

            <div className="wf-feature-grid">
              <article className="wf-feature-card">
                <div className="wf-feature-icon">
                  <Presentation size={24} />
                </div>
                <h3>Open Source i darmowe</h3>
                <p>
                  Masz pełną kontrolę nad kodem, danymi i sposobem wdrożenia bez zamkniętego lock-in.
                </p>
              </article>
              <article className="wf-feature-card">
                <div className="wf-feature-icon">
                  <Radio size={24} />
                </div>
                <h3>Wyniki na żywo</h3>
                <p>
                  Oglądaj odpowiedzi aktualizowane w czasie rzeczywistym i wyświetlaj je na ekranie prezentacji.
                </p>
              </article>
              <article className="wf-feature-card">
                <div className="wf-feature-icon">
                  <Code2 size={24} />
                </div>
                <h3>Łatwe udostępnianie</h3>
                <p>
                  QR i link uczestnika umożliwiają szybkie wdrożenie bez dodatkowej konfiguracji po stronie uczestnika.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="wf-shell" style={{ paddingBottom: 48 }}>
          <div className="wf-cta-card">
            <div className="wf-feature-icon" style={{ margin: "0 auto" }}>
              <Leaf size={22} />
            </div>
            <h2 style={{ margin: 0, fontSize: 36, letterSpacing: "-0.04em" }}>Zacznij zbierać dane już dziś</h2>
            <p className="wf-page-subtitle" style={{ maxWidth: 680, margin: "0 auto" }}>
              Utwórz ankietę, pokaż kod QR uczestnikom i obserwuj odpowiedzi na żywo bez zbędnych kroków.
            </p>
            <div className="wf-hero-actions" style={{ justifyContent: "center" }}>
              {isSignedIn ? (
                <Link className="wf-btn wf-btn-primary" href="/admin">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link className="wf-btn wf-btn-primary" href="/auth?mode=register">
                    Uruchom projekt
                  </Link>
                  <Link className="wf-btn wf-btn-secondary" href="/guides">
                    Jak to działa
                  </Link>
                </>
              )}
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
          <div>
            © 2026{" "}
            <Link href="/">
              Made with Wojticore Flowa
            </Link>
          </div>
          <nav className="wf-footer-nav">
            <Link href="/guides">Dokumentacja</Link>
            <Link href="/auth?mode=register">Rejestracja</Link>
            {isSignedIn ? <Link href="/admin">Dashboard</Link> : null}
          </nav>
        </div>
      </footer>
    </>
  );
}

