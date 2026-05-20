import {
  ArrowRight,
  ChartColumn,
  Code2,
  Leaf,
  Presentation,
  QrCode,
  Radio,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

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
              {isSignedIn ? (
                <Link className="wf-btn wf-btn-primary" href="/admin">
                  Dashboard
                </Link>
              ) : (
                <Link className="wf-btn wf-btn-primary" href="/auth?mode=register">
                  Zaczynamy
                  <ArrowRight size={18} />
                </Link>
              )}
              <Link className="wf-btn wf-btn-secondary" href="/guides">
                Dokumentacja
              </Link>
            </div>
          </div>

          <div className="wf-hero-preview">
            <div className="wf-hero-preview-header">
              <div>
                <div className="wf-small-label">Wyniki na żywo</div>
                <div className="wf-admin-org-name">Jedno miejsce do pracy z ankietami</div>
              </div>
              <div className="wf-pill wf-pill-soft">Live</div>
            </div>

            <div className="wf-hero-preview-grid">
              <article className="wf-hero-preview-card">
                <div className="wf-feature-icon">
                  <ChartColumn size={20} />
                </div>
                <div className="wf-small-label">Średni wynik</div>
                <div className="wf-hero-preview-value">4h 12m</div>
              </article>
              <article className="wf-hero-preview-card">
                <div className="wf-feature-icon">
                  <Radio size={20} />
                </div>
                <div className="wf-small-label">Aktywne sesje</div>
                <div className="wf-hero-preview-value">12</div>
              </article>
              <article className="wf-hero-preview-card">
                <div className="wf-feature-icon">
                  <QrCode size={20} />
                </div>
                <div className="wf-small-label">QR i embed</div>
                <div className="wf-table-muted">Udostępnianie na prezentacji i na żywo.</div>
              </article>
              <article className="wf-hero-preview-card">
                <div className="wf-feature-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="wf-small-label">Bezpieczny dostęp</div>
                <div className="wf-table-muted">Widoczność ankiet ograniczona per użytkownik.</div>
              </article>
            </div>

            <div className="wf-hero-preview-list">
              <div className="wf-hero-preview-row">
                <span>Panel organizatora</span>
                <span>Jednolity header i sidebar</span>
              </div>
              <div className="wf-hero-preview-row">
                <span>Wyniki na żywo</span>
                <span>Tryb prezentacyjny i embed</span>
              </div>
              <div className="wf-hero-preview-row">
                <span>Przepływ ankiety</span>
                <span>4 kroki bez przeciążenia</span>
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
                <h3>Łatwa integracja</h3>
                <p>
                  QR, embed i publiczny link umożliwiają szybkie wdrożenie bez dodatkowej konfiguracji po stronie uczestnika.
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

