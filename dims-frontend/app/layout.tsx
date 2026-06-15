import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import Providers from "@/components/provider";
import { WebVitals } from "@/components/WebVitals";

const rubik = Rubik({
  subsets: ["latin", "latin-ext"],
  variable: "--font-rubik",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "DIMS — Dana Internal Mail",
    template: "%s | DIMS",
  },
  description: "Enterprise email and intranet platform for Dana Group",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DIMS",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#2e348f",
  openGraph: {
    title: "DIMS — Dana Internal Mail & Intranet System",
    description: "Enterprise email and intranet platform for Dana Group",
    type: "website",
    url: "https://dims.danagroup.internal",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "DIMS — Dana Internal Mail",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={rubik.variable} suppressHydrationWarning>
      <body className="font-rubik antialiased">
        <Providers>
          <WebVitals />
          {children}
        </Providers>
      </body>
    </html>
  );
}
