"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/repositories", label: "Repositories" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-hairline bg-canvas-white sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-near-black text-white text-center py-2 text-micro">
        Code Duplication Analyzer — Powered by Winnowing Algorithm &amp; AST Fingerprinting
      </div>

      <nav className="container-main flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-near-black font-display font-semibold text-lg tracking-tight">
            CSCD2
          </span>
          <span className="hidden sm:inline text-muted-slate text-caption">
            / Code Duplication Analyzer
          </span>
        </Link>

        {/* Center nav */}
        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "text-body transition-colors",
                  pathname === link.href
                    ? "text-ink font-medium"
                    : "text-muted-slate hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link href="/repositories" className="btn-primary text-sm px-4 py-2">
          Connect Repo
        </Link>
      </nav>
    </header>
  );
}
