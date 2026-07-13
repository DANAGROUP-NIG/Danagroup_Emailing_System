import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { headers } from "next/headers";
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
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://dims.danagroup.internal"
  ),
  formatDetection: {
    telephone: false,
  },
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

export const viewport: Viewport = {
  themeColor: "#2e348f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={rubik.variable} suppressHydrationWarning>
      <body className="font-rubik antialiased">
        <Providers {...(nonce ? { nonce } : {})}>
          <WebVitals />
          {children}
        </Providers>
      </body>
    </html>
  );
}
