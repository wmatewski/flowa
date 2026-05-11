# My Screen Time

Mobilna aplikacja webowa w Next.js 16.1.6 do zbierania i analizowania czasu przed ekranem z publiczną rejestracją użytkowników, własnymi sesjami i panelem administratora opartym o Clerk i Neon.

## Stack

- Next.js 16.1.6
- React 19
- Clerk (własne formularze logowania/rejestracji, bez gotowych komponentów)
- Neon PostgreSQL
- Firebase App Hosting

## Co jest gotowe

- Strona dla użytkownika bez logowania.
- Publiczna rejestracja i logowanie użytkowników w `/account/register` oraz `/account/login`.
- Automatyczne tworzenie organizacji dla nowego właściciela i role `owner` / `member`.
- Panel `/panel` do tworzenia własnych sesji, podglądu live danych i zarządzania członkami organizacji.
- Publiczne strony `/session/[slug]` do wpisywania czasu przed ekranem dla konkretnej sesji.
- Link publiczny i kod QR dla każdej utworzonej sesji.
- Zapraszanie nowych użytkowników do organizacji przez Clerk Invitations.
- Automatyczne wykrywanie systemu: iOS, Android, Windows, macOS, Linux lub `unknown`.
- Zapisywanie wpisów do Neon PostgreSQL z danymi: `uuid`, `session_id`, `screen_time_minutes`, `entry_date`, `ip`, `os`, `user_agent`.
- Panel `/admin` z logowaniem tylko dla administratorów.
- Zapraszanie nowych administratorów przez Clerk z poziomu panelu.
- `schema.sql` dla schematu `screentime`.
- Konfiguracja `apphosting.yaml` pod Firebase App Hosting.

## Ważne założenie

Aplikacja używa własnego schematu `flowa` w bazie Neon oraz identyfikatorów użytkownika z Clerk (`user_id` jako `text`).

## Konfiguracja lokalna

1. Uzupełnij wartości w `.env.local`.
2. W Neon uruchom `schema.sql`.
3. W Clerk włącz metodę logowania e-mail + hasło.
4. Zainstaluj zależności i uruchom dev server:

```bash
npm install
npm run dev
```

## Zmienne środowiskowe

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEON_DATABASE_URL`
- `NEXT_PUBLIC_RECOMMENDED_DAILY_LIMIT_MINUTES`
- `NEXT_PUBLIC_SESSION_COOKIE_NAME`

## Firebase App Hosting

W `apphosting.yaml` są już przygotowane zmienne i sekrety. Przed rolloutem ustaw w Firebase / Secret Manager:

- `FLOWA_CLERK_PUBLISHABLE_KEY`
- `FLOWA_CLERK_SECRET_KEY`
- `FLOWA_NEON_DATABASE_URL`

## Benchmark dla wyniku

Aplikacja używa orientacyjnego limitu `120 minut` dziennie dla rekreacyjnego screen time u młodzieży 12-17 lat. To bazuje na zaleceniach Canadian 24-Hour Movement Guidelines.
