import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSCD2 — Code Duplication Analyzer",
  description: "Detect code duplication between GitHub branches and pull requests",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-white text-ink">
        {children}
      </body>
    </html>
  );
}
