import type { OperatingSystem, OperatingSystemConfig } from "@/lib/types";

const mobileOperatingSystems = ["ios", "android"] as const satisfies readonly OperatingSystem[];
const desktopOperatingSystems = ["windows", "macos", "linux"] as const satisfies readonly OperatingSystem[];

export const operatingSystemConfig: Record<OperatingSystem, OperatingSystemConfig> = {
  ios: {
    key: "ios",
    label: "iOS",
    shortLabel: "iPhone / iPad",
    headline: "Sprawdź czas w Czasie przed ekranem",
    description:
      "Najczęściej potrzebujesz sekcji Czas przed ekranem w aplikacji Ustawienia.",
    settingsButtonLabel: "Otwórz ustawienia iOS",
    settingsHint:
      "Safari może nie zawsze otworzyć ustawienia bezpośrednio. Jeśli skrót nie zadziała, wykonaj kroki ręcznie.",
    settingsLink: "app-settings:",
    steps: [
      "Otwórz aplikację Ustawienia na ekranie głównym.",
      "Wejdź w sekcję Czas przed ekranem.",
      "Kliknij Zobacz całą aktywność i odczytaj dzisiejszy wynik.",
    ],
  },
  android: {
    key: "android",
    label: "Android",
    shortLabel: "Telefon z Androidem",
    headline: "Odczytaj wynik z Cyfrowej równowagi",
    description:
      "Na Androidzie wynik zwykle znajduje się w ustawieniach Cyfrowa równowaga i kontrola rodzicielska.",
    settingsButtonLabel: "Spróbuj otworzyć ustawienia Androida",
    settingsHint:
      "Nie każda przeglądarka mobilna pozwala otwierać ustawienia systemowe. Jeśli nic się nie stanie, wykonaj kroki ręcznie.",
    settingsLink: "intent://settings#Intent;action=android.settings.SETTINGS;end",
    steps: [
      "Otwórz systemowe Ustawienia urządzenia.",
      "Wybierz Cyfrowa równowaga i kontrola rodzicielska.",
      "Dotknij wykresu dzisiejszej aktywności i odczytaj łączny czas.",
    ],
  },
  windows: {
    key: "windows",
    label: "Windows",
    shortLabel: "Komputer z Windows",
    headline: "Sprawdź aktywność systemową lub wpisz wynik ręcznie",
    description:
      "Windows nie ma jednego uniwersalnego widoku screen time, więc możesz skorzystać z Family Safety, narzędzia producenta albo przepisać wynik z telefonu.",
    settingsButtonLabel: "Otwórz ustawienia Windows",
    settingsHint:
      "Jeśli korzystasz z telefonu, możesz ręcznie zmienić wykryty system przed zapisaniem wpisu.",
    settingsLink: "ms-settings:",
    steps: [
      "Otwórz Ustawienia systemu Windows.",
      "Sprawdź raport aktywności lub aplikację Family Safety, jeśli jest dostępna.",
      "Jeśli mierzysz czas z telefonu, wybierz właściwy system i wpisz wynik ręcznie.",
    ],
  },
  macos: {
    key: "macos",
    label: "macOS",
    shortLabel: "Mac",
    headline: "Odczytaj wynik z funkcji Czas przed ekranem",
    description:
      "Na macOS wynik znajdziesz w Ustawieniach systemowych w sekcji Czas przed ekranem.",
    settingsButtonLabel: "Otwórz ustawienia macOS",
    settingsHint:
      "Nie każda przeglądarka na Macu obsługuje skróty systemowe. W razie potrzeby skorzystaj z kroków ręcznych.",
    settingsLink: "x-apple.systempreferences:",
    steps: [
      "Otwórz Ustawienia systemowe.",
      "Wejdź w Czas przed ekranem.",
      "Sprawdź dzisiejsze użycie i wpisz je do formularza.",
    ],
  },
  linux: {
    key: "linux",
    label: "Linux",
    shortLabel: "Linux",
    headline: "Wpisz wynik z używanego narzędzia lub telefonu",
    description:
      "Linux zwykle nie ma jednolitej funkcji screen time, więc wpis może pochodzić z zewnętrznego narzędzia albo z telefonu.",
    settingsButtonLabel: "Brak uniwersalnego skrótu dla Linuxa",
    settingsHint:
      "Dla Linuxa przygotowaliśmy tylko instrukcję ręczną, bo skróty ustawień zależą od dystrybucji i środowiska graficznego.",
    settingsLink: null,
    steps: [
      "Otwórz używane narzędzie monitorujące aktywność albo sprawdź wynik na telefonie.",
      "Jeśli przepisujesz dane z telefonu, wybierz właściwy system przed zapisaniem wpisu.",
      "Wprowadź godziny i minuty w formularzu poniżej.",
    ],
  },
  unknown: {
    key: "unknown",
    label: "Nieznany system",
    shortLabel: "Nie rozpoznano",
    headline: "Nie rozpoznaliśmy systemu automatycznie",
    description:
      "Możesz dalej korzystać z aplikacji. Wybierz właściwy system ręcznie przed zapisaniem wyniku.",
    settingsButtonLabel: "Skorzystaj z instrukcji ręcznej",
    settingsHint:
      "Najlepiej wybierz właściwy system ręcznie i wykonaj odpowiadające mu kroki.",
    settingsLink: null,
    steps: [
      "Wybierz odpowiedni system ręcznie.",
      "Otwórz ustawienia urządzenia i sprawdź dzisiejszy czas przed ekranem.",
      "Wpisz wynik do formularza i zapisz analizę.",
    ],
  },
};

export const operatingSystemOrder: OperatingSystem[] = [
  "ios",
  "android",
  "windows",
  "macos",
  "linux",
  "unknown",
];

const isMobileUserAgent = (userAgent: string | null | undefined) => {
  if (!userAgent) {
    return false;
  }

  const value = userAgent.toLowerCase();

  return (
    value.includes("android") ||
    value.includes("iphone") ||
    value.includes("ipad") ||
    value.includes("ipod") ||
    value.includes("mobile")
  );
};

export const detectOperatingSystem = (
  userAgent: string | null | undefined,
): OperatingSystem => {
  if (!userAgent) {
    return "unknown";
  }

  const value = userAgent.toLowerCase();

  if (value.includes("android")) {
    return "android";
  }

  if (
    value.includes("iphone") ||
    value.includes("ipad") ||
    value.includes("ipod") ||
    (value.includes("macintosh") && value.includes("mobile"))
  ) {
    return "ios";
  }

  if (value.includes("windows")) {
    return "windows";
  }

  if (value.includes("mac os") || value.includes("macintosh")) {
    return "macos";
  }

  if (value.includes("linux") || value.includes("x11")) {
    return "linux";
  }

  return "unknown";
};

export const getAvailableOperatingSystems = (
  userAgent: string | null | undefined,
): OperatingSystem[] => {
  if (isMobileUserAgent(userAgent)) {
    return [...mobileOperatingSystems];
  }

  return [...desktopOperatingSystems];
};

export const isOperatingSystem = (value: string): value is OperatingSystem =>
  Object.hasOwn(operatingSystemConfig, value);

export const getOperatingSystemConfig = (value: OperatingSystem) =>
  operatingSystemConfig[value];
