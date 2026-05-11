import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
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
      <body className={`${manrope.variable} ${inter.variable}`}>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}