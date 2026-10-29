import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MechGuide — prototype",
  description: "Interactive car component and repair guide (prototype)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="logo">Mech<span>Guide</span></Link>
          <span className="proto">Prototype · cross-check every value with official manufacturer data</span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
