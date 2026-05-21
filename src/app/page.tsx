import { ArrowRight, ChartColumn, Leaf, Presentation, QrCode, Radio } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";

const githubUrl = "https://github.com/wmatewski/wojticore-flowa";

export default async function HomePage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <>
      <header className="wf-topbar">
        <div className="wf-topbar-inner wf-landing-topbar">
          <Link className="wf-brand" href="/">
            <div className="wf-brand-mark">
              <Leaf size={16} />
            </div>
            <span>Wojticore Flowa</span>
          </Link>

          <nav className="wf-nav wf-landing-nav">
            {isSignedIn ? (
              <Link className="wf-nav-link" href="/admin">
                Dashboard
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link className="wf-nav-link" href="/auth?mode=login">
                  Logowanie
                </Link>
                <Link className="wf-nav-link" href="/auth?mode=register">
                  Rejestracja
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="wf-public-page wf-landing-page">
        <section className="wf-shell wf-landing-hero">
          <div className="wf-hero-copy wf-landing-copy">
            <div className="wf-badge">NASZA ORGANIZACJA</div>
            <h1>Wojticore Flowa</h1>
            <p>
              Interaktywne ankiety o czasie przed ekranem na żywo w Twojej prezentacji.
            </p>
            <div className="wf-hero-actions">
              <Button asChild className="wf-hero-primary-link">
                <Link href={isSignedIn ? "/admin" : "/auth?mode=register"}>
                  {isSignedIn ? "Przejdź do panelu" : "Rozpocznij"}
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <a className="wf-btn wf-btn-secondary" href={githubUrl} rel="noreferrer" target="_blank">
                Zobacz na GitHubie
                <ArrowRight size={18} />
              </a>
            </div>
          </div>

          <div className="wf-landing-visual">
            <div className="wf-hero-visual-card wf-landing-visual-card">
              <div className="wf-hero-visual-accent wf-hero-visual-accent-top" />
              <div className="wf-hero-visual-accent wf-hero-visual-accent-bottom" />
              <div className="wf-landing-visual-window">
                <div className="wf-landing-visual-window-topbar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="wf-landing-visual-window-body">
                  <div className="wf-landing-visual-monitor">
                    <div className="wf-landing-visual-monitor-screen">
                      <div className="wf-landing-visual-bars">
                        <span style={{ height: "42%" }} />
                        <span style={{ height: "58%" }} />
                        <span style={{ height: "74%" }} />
                        <span style={{ height: "61%" }} />
                        <span style={{ height: "88%" }} />
                      </div>
                      <div className="wf-landing-visual-rings">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className="wf-landing-visual-monitor-base" />
                  </div>
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
            <header className="wf-landing-section-header">
              <h2>Dlaczego Wojticore Flowa?</h2>
              <p>Zaplanowane pod szybkie wdrożenie, czytelne wyniki i spokojną prezentację.</p>
            </header>

            <div className="wf-landing-feature-grid">
              <article className="wf-feature-card wf-landing-feature-card">
                <div className="wf-feature-icon">
                  <Presentation size={24} />
                </div>
                <h3>Open Source i darmowe</h3>
                <p>Masz pełną kontrolę nad kodem, danymi i sposobem wdrożenia bez zamkniętego lock-in.</p>
                <div className="wf-landing-feature-art wf-landing-feature-art-lock">
                  <div className="wf-landing-feature-art-block wf-landing-feature-art-block-a" />
                  <div className="wf-landing-feature-art-block wf-landing-feature-art-block-b" />
                  <div className="wf-landing-feature-art-block wf-landing-feature-art-block-c" />
                </div>
              </article>

              <article className="wf-feature-card wf-landing-feature-card">
                <div className="wf-feature-icon">
                  <Radio size={24} />
                </div>
                <h3>Wyniki na żywo</h3>
                <p>Oglądaj odpowiedzi aktualizowane w czasie rzeczywistym i wyświetlaj je na ekranie prezentacji.</p>
                <div className="wf-landing-feature-art wf-landing-feature-art-bars">
                  <span />
                  <span />
                  <span />
                </div>
              </article>

              <article className="wf-feature-card wf-landing-feature-card wf-landing-feature-card-wide">
                <div className="wf-landing-feature-wide-copy">
                  <div className="wf-feature-icon">
                    <QrCode size={24} />
                  </div>
                  <h3>Łatwa integracja</h3>
                  <p>QR i link uczestnika pozwalają uruchomić ankietę bez dodatkowych kroków po stronie uczestnika.</p>
                </div>
                <div className="wf-landing-qr-card">
                  <div className="wf-landing-qr-grid">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <span className={index % 3 === 0 ? "is-dark" : index % 5 === 0 ? "is-light" : ""} key={index} />
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="wf-landing-how" id="jak-to-dziala">
          <div className="wf-shell">
            <header className="wf-landing-section-header">
              <h2>Jak to działa?</h2>
              <p>Trzy proste kroki do zaangażowania publiczności.</p>
            </header>

            <div className="wf-landing-steps">
              <article className="wf-landing-step">
                <div className="wf-landing-step-icon">
                  <span>1</span>
                </div>
                <h3>Stwórz ankietę</h3>
                <p>Zdefiniuj pytania o czas przed ekranem w intuicyjnym panelu.</p>
              </article>
              <article className="wf-landing-step">
                <div className="wf-landing-step-icon">
                  <span>2</span>
                </div>
                <h3>Udostępnij QR</h3>
                <p>Wyświetl kod na ekranie. Uczestnicy dołączają bez instalacji aplikacji.</p>
              </article>
              <article className="wf-landing-step">
                <div className="wf-landing-step-icon">
                  <span>3</span>
                </div>
                <h3>Wyniki na żywo</h3>
                <p>Obserwuj jak wykresy aktualizują się z każdą nową odpowiedzią.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="wf-shell wf-landing-cta-section">
          <div className="wf-cta-card wf-landing-cta-card">
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
                  Panel
                </Link>
              ) : (
                <>
                  <Link className="wf-btn wf-btn-primary" href="/auth?mode=register">
                    Uruchom projekt
                  </Link>
                  <Link className="wf-btn wf-btn-secondary" href="/guides">
                    Dokumentacja
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="wf-footer">
        <div className="wf-footer-inner wf-landing-footer-inner">
          <div>
            <div className="wf-brand">
              <div className="wf-brand-mark">
                <Leaf size={16} />
              </div>
              <span>Wojticore Flowa</span>
            </div>
            <div className="wf-footer-muted" style={{ marginTop: 8 }}>
              © 2026 Wojticore Flowa. Open-source under MIT License.
            </div>
          </div>
          <nav className="wf-footer-nav">
            <Link href="#funkcje">Funkcje</Link>
            <Link href="#jak-to-dziala">Jak to działa</Link>
            <Link href="/guides">Dokumentacja</Link>
            <a href={githubUrl} rel="noreferrer" target="_blank">
              GitHub
            </a>
            {isSignedIn ? <Link href="/admin">Panel</Link> : <Link href="/auth?mode=register">Rejestracja</Link>}
          </nav>
        </div>
      </footer>
    </>
  );
}
