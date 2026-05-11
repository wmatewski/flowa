import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

import { ClerkProvider } from "@clerk/nextjs";

import "@/app/globals.css";

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
      <body className={`${inter.className} ${manrope.variable} ${inter.variable}`}>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}