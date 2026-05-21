import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polityka Prywatności | Wojticore Flowa",
  description: "Polityka Prywatności aplikacji Wojticore Flowa.",
};

export default function PrivacyPage() {
  return (
    <main className="wf-public-page">
      <section className="wf-shell" style={{ maxWidth: 920 }}>
        <header style={{ marginBottom: 40 }}>
          <div className="wf-badge">Dokument prawny</div>
          <h1 className="wf-page-title" style={{ marginTop: 16 }}>
            Polityka Prywatności — Wojticore Flowa
          </h1>
          <p className="wf-page-subtitle">
            Data obowiązywania: 21 maja 2026 r.
          </p>
        </header>

        <article className="wf-page-card" style={{ display: "grid", gap: 28, lineHeight: 1.7 }}>
          <section>
            <h2>1. Informacje ogólne</h2>
            <p>
              Niniejsza Polityka Prywatności opisuje zasady przetwarzania danych osobowych w aplikacji Wojticore Flowa („Aplikacja”).
            </p>
            <p>
              Wojticore Flowa umożliwia organizatorom tworzenie oraz zarządzanie formularzami, wydarzeniami, zapisami, zgłoszeniami lub innymi sesjami zbierania danych od użytkowników końcowych.
            </p>
          </section>

          <section>
            <h2>2. Administrator danych</h2>
            <p>
              Administratorem danych przekazywanych przez użytkownika końcowego jest przede wszystkim organizator lub administrator danej sesji („Organizator”), który zbiera dane za pomocą Wojticore Flowa.
            </p>
            <p>
              Wojticore Flowa działa częściowo jako podmiot przetwarzający dane na rzecz Organizatora.
            </p>
            <p>
              W zależności od charakteru usługi, Wojticore Flowa może również współdecydować o sposobach przetwarzania wybranych danych technicznych oraz bezpieczeństwa systemu.
            </p>
          </section>

          <section>
            <h2>3. Jakie dane mogą być przetwarzane</h2>
            <p>Aplikacja może przetwarzać dane podane dobrowolnie przez użytkownika, w szczególności:</p>
            <ul>
              <li>imię i nazwisko,</li>
              <li>adres e-mail,</li>
              <li>numer telefonu,</li>
              <li>adres,</li>
              <li>treść formularzy,</li>
              <li>dane przesłane w zgłoszeniach,</li>
              <li>dane techniczne urządzenia,</li>
              <li>adres IP,</li>
              <li>informacje o przeglądarce i systemie operacyjnym.</li>
            </ul>
            <p>
              Zakres danych zależy od konfiguracji ustawionej przez Organizatora sesji.
            </p>
          </section>

          <section>
            <h2>4. Cel przetwarzania danych</h2>
            <p>Dane mogą być przetwarzane w celu:</p>
            <ul>
              <li>realizacji działania formularzy i sesji,</li>
              <li>przekazywania danych Organizatorowi,</li>
              <li>kontaktu z użytkownikiem,</li>
              <li>zapewnienia bezpieczeństwa systemu,</li>
              <li>wykrywania nadużyć,</li>
              <li>prowadzenia statystyk i analityki,</li>
              <li>poprawy działania Aplikacji.</li>
            </ul>
          </section>

          <section>
            <h2>5. Przekazywanie danych Organizatorowi</h2>
            <p>
              Dane wpisane przez użytkownika są przekazywane administratorowi lub Organizatorowi danej sesji.
            </p>
            <p>
              Organizator odpowiada za sposób wykorzystania danych po ich otrzymaniu, w tym za zgodność ich przetwarzania z obowiązującymi przepisami prawa.
            </p>
          </section>

          <section>
            <h2>6. Odpowiedzialność za dane</h2>
            <p>
              Za treść, legalność oraz podstawę przetwarzania danych odpowiada przede wszystkim Organizator sesji.
            </p>
            <p>
              Wojticore Flowa dokłada należytej staranności w zakresie bezpieczeństwa i infrastruktury systemu, jednak nie ponosi pełnej odpowiedzialności za działania Organizatora ani za dane wprowadzane przez użytkowników.
            </p>
            <p>
              W zakresie infrastruktury technicznej, bezpieczeństwa systemu oraz działania platformy, odpowiedzialność może być częściowo ponoszona również przez Wojticore Flowa.
            </p>
          </section>

          <section>
            <h2>7. Infrastruktura i dostawcy usług</h2>
            <p>Wojticore Flowa korzysta z usług zewnętrznych dostawców infrastruktury i analityki, w tym:</p>
            <ul>
              <li>
                <a href="https://neon.tech" rel="noreferrer" target="_blank">
                  Neon
                </a>{" "}
                - baza danych hostowana na serwerach zlokalizowanych na terenie Unii Europejskiej,
              </li>
              <li>
                <a href="https://umami.is" rel="noreferrer" target="_blank">
                  Umami Analytics
                </a>{" "}
                - system anonimowej lub ograniczonej analityki ruchu,
              </li>
              <li>
                <a href="https://www.cookiebot.com" rel="noreferrer" target="_blank">
                  Cookiebot
                </a>{" "}
                - system zarządzania zgodami cookies.
              </li>
            </ul>
            <p>
              Dostawcy ci mogą przetwarzać ograniczone dane techniczne zgodnie ze swoimi politykami prywatności.
            </p>
          </section>

          <section>
            <h2>8. Cookies</h2>
            <p>
              Aplikacja może wykorzystywać pliki cookies oraz podobne technologie w celu:
            </p>
            <ul>
              <li>utrzymania sesji użytkownika,</li>
              <li>zapewnienia działania systemu,</li>
              <li>zapamiętywania ustawień,</li>
              <li>analityki ruchu,</li>
              <li>zarządzania zgodami użytkownika.</li>
            </ul>
            <p>
              Zgody dotyczące cookies mogą być zarządzane za pomocą Cookiebot.
            </p>
          </section>

          <section>
            <h2>9. Bezpieczeństwo danych</h2>
            <p>
              Wojticore Flowa stosuje odpowiednie środki techniczne i organizacyjne mające na celu ochronę danych przed:
            </p>
            <ul>
              <li>nieautoryzowanym dostępem,</li>
              <li>utratą danych,</li>
              <li>modyfikacją,</li>
              <li>ujawnieniem,</li>
              <li>nadużyciem.</li>
            </ul>
            <p>
              Pomimo stosowanych zabezpieczeń żadna metoda transmisji danych przez Internet nie gwarantuje pełnego bezpieczeństwa.
            </p>
          </section>

          <section>
            <h2>10. Prawa użytkownika</h2>
            <p>Użytkownik może posiadać prawo do:</p>
            <ul>
              <li>dostępu do swoich danych,</li>
              <li>sprostowania danych,</li>
              <li>usunięcia danych,</li>
              <li>ograniczenia przetwarzania,</li>
              <li>wniesienia sprzeciwu,</li>
              <li>przenoszenia danych,</li>
              <li>złożenia skargi do właściwego organu nadzorczego.</li>
            </ul>
            <p>
              W sprawach dotyczących danych przekazanych Organizatorowi użytkownik powinien kontaktować się przede wszystkim z Organizatorem danej sesji.
            </p>
          </section>

          <section>
            <h2>11. Zmiany Polityki Prywatności</h2>
            <p>
              Wojticore Flowa może aktualizować niniejszą Politykę Prywatności.
            </p>
            <p>
              Nowa wersja obowiązuje od momentu jej opublikowania w Aplikacji.
            </p>
          </section>

          <section>
            <h2>12. Kontakt</h2>
            <p>
              W sprawach związanych z prywatnością można kontaktować się z administracją Wojticore Flowa poprzez dane kontaktowe udostępnione w Aplikacji.
            </p>
          </section>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Link className="wf-btn wf-btn-secondary" href="/">
              Wróć na stronę główną
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
