"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/header";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { actor, PlenifyContext } from "./context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header></Header>
        <main>
          <PlenifyContext.Provider value={actor}>
            {children}
          </PlenifyContext.Provider>
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
