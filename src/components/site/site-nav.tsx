"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Field notes" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-bg/70 border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex-shrink-0 -my-2"
          aria-label="Trellee home"
        >
          <Logo size="sm" priority />
        </Link>
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-1 text-sm"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "px-3 py-1.5 rounded-md transition",
                  isActive
                    ? "text-fg bg-surface-2"
                    : "text-muted hover:text-fg hover:bg-surface-2",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/portfolio"
            className="btn btn-ghost btn-sm hidden lg:inline-flex"
          >
            See work
          </Link>
          <Link href="/book" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Book a call <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
