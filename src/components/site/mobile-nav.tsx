"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Field notes" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 -mr-2 text-fg rounded-md hover:bg-surface-2 transition"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer — explicit h-dvh because in some preview/iframe contexts the
          top:0/bottom:0 stretching doesn't resolve correctly. dvh accounts for
          mobile browser UI chrome correctly when it shows/hides. */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 w-[88%] max-w-sm h-dvh max-h-screen bg-bg border-l border-border flex flex-col md:hidden transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <Link
            href="/"
            className="-my-1"
            onClick={() => setOpen(false)}
            aria-label="Trellee home"
          >
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-2 -mr-2 text-muted hover:text-fg rounded-md hover:bg-surface-2 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-5">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-3 rounded-md font-display text-2xl tracking-tight transition",
                      active ? "text-fg bg-surface-2" : "text-muted hover:text-fg hover:bg-surface-2/60",
                    )}
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight
                      className={cn(
                        "w-4 h-4 transition",
                        active ? "opacity-100" : "opacity-40",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-5 border-t border-border space-y-2">
          <Link
            href="/book"
            className="btn btn-primary w-full justify-center"
          >
            Book a call <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/portfolio"
            className="btn btn-secondary w-full justify-center"
          >
            See the work
          </Link>
        </div>
      </div>
    </>
  );
}
