"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getSessionEntryStorageKey } from "@/lib/session-entry";
import type { OperatingSystem } from "@/lib/types";
import { TimeInputMask } from "@/components/user/time-input-mask";

interface ScreenTimeStepFormProps {
  age: number;
  initialMinutes?: number | null;
  operatingSystem: OperatingSystem;
  sessionId: string;
  sessionSlug: string;
  submitAction: (formData: FormData) => Promise<void>;
}

const formatMinutesToInput = (minutes: number | null | undefined) => {
  if (minutes == null || Number.isNaN(minutes)) {
    return "";
  }

  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
};

const presets = [30, 60, 120, 240];

const presetToInput = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
};

const presetLabel = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const osLabelFallback: Record<OperatingSystem, string> = {
  android: "Android",
  ios: "iOS",
  linux: "Linux",
  macos: "macOS",
  unknown: "Nieznany system",
  windows: "Windows",
};
const MOBILE_VIEWPORT_MAX_WIDTH = 900;
const BROWSER_LANGUAGES_SEPARATOR = ", ";

interface NavigatorWithClientHints extends Navigator {
  deviceMemory?: number;
  connection?: NavigatorConnectionData;
  mozConnection?: NavigatorConnectionData;
  webkitConnection?: NavigatorConnectionData;
}

interface NavigatorConnectionData {
  effectiveType?: string;
  rtt?: number;
  downlink?: number;
  saveData?: boolean;
}

const formatDeviceMemoryLabel = (deviceMemory: number | undefined) =>
  typeof deviceMemory === "number" ? `${deviceMemory} GB` : "Niedostępne";

const detectDeviceType = (userAgent: string, hasTouch: boolean, viewportWidth: number) => {
  const value = userAgent.toLowerCase();

  if (/(ipad|tablet)/i.test(value)) {
    return "Tablet";
  }

  if (/(mobi|iphone|ipod|android)/i.test(value) || (hasTouch && viewportWidth < MOBILE_VIEWPORT_MAX_WIDTH)) {
    return "Mobile";
  }

  return "Desktop";
};

const parseOperatingSystemLabel = (userAgent: string, operatingSystem: OperatingSystem) => {
  const value = userAgent.toLowerCase();
  const iosMatch = userAgent.match(/OS ([\d_]+) like Mac OS X/i);
  const androidMatch = userAgent.match(/Android ([\d.]+)/i);
  const windowsMatch = userAgent.match(/Windows NT ([\d.]+)/i);
  const macMatch = userAgent.match(/Mac OS X ([\d_]+)/i);

  if (iosMatch?.[1]) {
    return `iOS ${iosMatch[1].replace(/_/g, ".")}`;
  }

  if (androidMatch?.[1]) {
    return `Android ${androidMatch[1]}`;
  }

  if (windowsMatch?.[1]) {
    return `Windows ${windowsMatch[1]}`;
  }

  if (macMatch?.[1] && !value.includes("iphone") && !value.includes("ipad")) {
    return `macOS ${macMatch[1].replace(/_/g, ".")}`;
  }

  if (value.includes("linux")) {
    return "Linux";
  }

  return osLabelFallback[operatingSystem];
};

const parseBrowserLabelBestEffort = (userAgent: string, deviceType: string) => {
  const browserMatchers = [
    { key: "Edg", label: "Edge" },
    { key: "OPR", label: "Opera" },
    { key: "CriOS", label: deviceType === "Mobile" ? "Mobile Chrome" : "Chrome" },
    { key: "Chrome", label: deviceType === "Mobile" ? "Mobile Chrome" : "Chrome" },
    { key: "FxiOS", label: deviceType === "Mobile" ? "Mobile Firefox" : "Firefox" },
    { key: "Firefox", label: deviceType === "Mobile" ? "Mobile Firefox" : "Firefox" },
    { key: "Version", label: deviceType === "Mobile" ? "Mobile Safari" : "Safari", requires: "Safari" },
  ];

  for (const matcher of browserMatchers) {
    if (matcher.requires && !userAgent.includes(matcher.requires)) {
      continue;
    }

    const match = userAgent.match(new RegExp(`${matcher.key}/([\\d.]+)`));

    if (match?.[1]) {
      return `${matcher.label} ${match[1]}`;
    }
  }

  return "Nieznana przeglądarka";
};

const getWebglGpu = () => {
  const canvas = document.createElement("canvas");
  const context =
    canvas.getContext("webgl") ??
    canvas.getContext("experimental-webgl");

  if (!context) {
    return null;
  }

  const webglContext = context as WebGLRenderingContext;
  const debugInfo = webglContext.getExtension("WEBGL_debug_renderer_info");

  if (!debugInfo) {
    return null;
  }

  const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

  return [vendor, renderer].filter(Boolean).join(" ").trim() || null;
};

const formatScreenDetails = () =>
  `${window.screen.width}x${window.screen.height} | viewport ${window.innerWidth}x${window.innerHeight} | dpr ${window.devicePixelRatio}`;

export const ScreenTimeStepForm = ({
  age,
  initialMinutes,
  operatingSystem,
  sessionId,
  sessionSlug,
  submitAction,
}: ScreenTimeStepFormProps) => {
  const [screenTimeValue, setScreenTimeValue] = useState(formatMinutesToInput(initialMinutes));
  const participantEnteredAtRef = useRef<HTMLInputElement>(null);
  const participantMetadataRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let currentStartedAt = new Date().toISOString();

    try {
      const storageKey = getSessionEntryStorageKey(sessionSlug);
      const storedStartedAt = window.sessionStorage.getItem(storageKey);

      if (storedStartedAt) {
        currentStartedAt = storedStartedAt;
      } else {
        window.sessionStorage.setItem(storageKey, currentStartedAt);
      }
    } catch {
      currentStartedAt = new Date().toISOString();
    }

    if (participantEnteredAtRef.current) {
      participantEnteredAtRef.current.value = currentStartedAt;
    }

    const navigatorData = navigator as NavigatorWithClientHints;
    const connectionData =
      navigatorData.connection ??
      navigatorData.mozConnection ??
      navigatorData.webkitConnection;
    const hasTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
    const deviceType = detectDeviceType(navigator.userAgent, hasTouch, window.innerWidth);
    const memoryValue = navigatorData.deviceMemory;
    const metadata = {
      deviceTypeLabel: deviceType,
      operatingSystemLabel: parseOperatingSystemLabel(navigator.userAgent, operatingSystem),
      browserLabel: parseBrowserLabelBestEffort(navigator.userAgent, deviceType),
      browserLanguages: navigator.languages?.join(BROWSER_LANGUAGES_SEPARATOR) ?? null,
      screenDetails: formatScreenDetails(),
      viewportDetails: `${window.innerWidth}x${window.innerHeight}`,
      orientation: window.screen.orientation?.type ?? null,
      browserLanguage: navigator.language || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      userLocalTime: new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date()),
      platform: navigator.platform || null,
      referrer: document.referrer || null,
      fullUserAgent: navigator.userAgent || null,
      memoryLabel: formatDeviceMemoryLabel(memoryValue),
      cpuCores: typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : null,
      touchScreen: hasTouch,
      cookiesEnabled: navigator.cookieEnabled,
      networkType: connectionData?.effectiveType ?? null,
      networkRttMs: typeof connectionData?.rtt === "number" ? connectionData.rtt : null,
      networkDownlinkMbps:
        typeof connectionData?.downlink === "number" ? connectionData.downlink : null,
      networkSaveData: typeof connectionData?.saveData === "boolean" ? connectionData.saveData : null,
      webglGpu: getWebglGpu(),
      fontCount: document.fonts ? Array.from(document.fonts).length : null,
      pluginsCount: typeof navigator.plugins?.length === "number" ? navigator.plugins.length : null,
      webdriverDetected: typeof navigator.webdriver === "boolean" ? navigator.webdriver : null,
    };
    if (participantMetadataRef.current) {
      participantMetadataRef.current.value = JSON.stringify(metadata);
    }
  }, [operatingSystem, sessionSlug]);

  return (
    <form action={submitAction} className="wf-form-stack wf-step-form">
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="sessionSlug" type="hidden" value={sessionSlug} />
      <input name="age" type="hidden" value={String(age)} />
      <input name="operatingSystem" type="hidden" value={operatingSystem} />
      <input defaultValue="" name="participantEnteredAt" ref={participantEnteredAtRef} type="hidden" />
      <input defaultValue="" name="participantMetadata" ref={participantMetadataRef} type="hidden" />

      <label className="wf-field">
        <span className="wf-field-label">Liczba godzin i minut</span>
        <TimeInputMask
          className="wf-step-time-input"
          name="screenTimeValue"
          onChange={setScreenTimeValue}
          value={screenTimeValue}
        />
      </label>

      <div className="wf-chip-row">
        {presets.map((minutes) => (
          <button
            className="wf-chip-button"
            key={minutes}
            onClick={() => setScreenTimeValue(presetToInput(minutes))}
            type="button"
          >
            {presetLabel(minutes)}
          </button>
        ))}
      </div>

      <button className="wf-btn wf-btn-primary wf-btn-block wf-btn-large" type="submit">
        Wyślij wynik
        <ArrowRight size={18} />
      </button>
    </form>
  );
};
