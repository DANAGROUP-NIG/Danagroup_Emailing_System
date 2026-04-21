import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import Providers from "@/components/provider";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DIMS — Dana Internal Mail",
    template: "%s | DIMS",
  },
  description: "Dana Internal Mail & Intranet System",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={rubik.variable}>
      <body className="font-rubik antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}