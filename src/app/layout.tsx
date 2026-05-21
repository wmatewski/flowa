import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";

import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Wojticore Flowa",
  description:
    "Platforma Wojticore Flowa do zarządzania sesjami, organizacjami i raportami czasu przed ekranem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          strategy="beforeInteractive"
          data-cbid="d858c1a8-0acf-4aa1-a983-adc3583e2047"
          data-blockingmode="auto"
          type="text/javascript"
        />
      </head>
      <body className={`${inter.className} ${manrope.variable} ${inter.variable}`}>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          strategy="afterInteractive"
          data-website-id="ab94b31e-25a7-4393-b128-73126383ad21"
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
