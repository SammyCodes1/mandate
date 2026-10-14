"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/#record", label: "Record", match: "/record" },
  { href: "/console", label: "Console", match: "/console" },
];

export function SiteHeader() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#100e0c]/92">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="nav-link text-[15px] font-medium tracking-tight text-[#f6f1e8]">
          Mandate
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-6 text-[14px]">
          {links.map((link) => {
            const active = path === link.match;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "text-[#d7a15f]" : "text-[#c9c2b6] hover:text-[#f6f1e8]"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
