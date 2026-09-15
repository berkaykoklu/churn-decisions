import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const DESCRIPTION =
  "A churn model outputs a probability. Acting on it needs a threshold, and 0.5 is a convention with nothing behind it. This derives the threshold from what a retention offer costs and saves — and shows why the probabilities have to mean what they say first.";

export const metadata: Metadata = {
  metadataBase: new URL("https://churn-decisions.vercel.app"),
  title: "From churn probability to a decision",
  description: DESCRIPTION,
  openGraph: { title: "From churn probability to a decision", description: DESCRIPTION, type: "website", locale: "en" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
