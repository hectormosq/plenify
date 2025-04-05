"use client";

import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/header";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { actor, PlenifyContext } from "./context";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "./styles/styles.scss";

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
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {children}
            </LocalizationProvider>
          </PlenifyContext.Provider>
        </main>
        <SpeedInsights />
      </body>
    </html>
  );
}
