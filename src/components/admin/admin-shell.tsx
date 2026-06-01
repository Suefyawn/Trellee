"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronRight,
  FileText,
  GitBranch,
  Globe,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Receipt,
  Settings,
  Star,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/_actions/auth";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Marketing site",
    items: [
      { href: "/admin/services", label: "Services", icon: Briefcase },
      { href: "/admin/projects", label: "Projects", icon: Workflow },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/blog/posts", label: "Blog posts", icon: Newspaper },
      { href: "/admin/blog/categories", label: "Categories", icon: FileText },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
    ],
  },
  {
    label: "Inbox",
    items: [
      { href: "/admin/crm", label: "Pipeline", icon: GitBranch },
      { href: "/admin/bookings", label: "Bookings", icon: Calendar },
      { href: "/admin/leads", label: "Contact leads", icon: Inbox },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/pm", label: "Project tracker", icon: ListChecks },
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/monitor", label: "Website monitor", icon: Globe },
    ],
  },
  {
    label: "Brand & about",
    items: [
      { href: "/admin/team", label: "Team", icon: Users },
      { href: "/admin/clients", label: "Clients", icon: Briefcase },
      { href: "/admin/process", label: "Process steps", icon: Workflow },
      { href: "/admin/values", label: "Values", icon: Star },
      { href: "/admin/activity", label: "Activity feed", icon: Activity },
      { href: "/admin/social", label: "Social links", icon: MessageSquare },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/admin/settings", label: "Site settings", icon: Settings }],
  },
];

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Robust scroll lock (mobile): pin the body and restore scroll position on
  // close, so the viewport doesn't break when the drawer is opened mid-scroll.
  useEffect(() => {
    if (!drawerOpen) return;
    const y = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, y);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen lg:flex bg-bg text-fg">
      {/* Mobile topbar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 border-b border-border bg-bg/80 backdrop-blur-md print:hidden">
        <Link href="/admin" className="flex items-center gap-3" aria-label="Trellee admin">
          <Logo size="sm" />
          <span className="t-mono text-muted text-xs uppercase tracking-wider">
            admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="p-2 -mr-2 rounded-md text-fg hover:bg-surface-2 transition"
          aria-label="Open admin menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer overlay (mobile) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm transition-opacity lg:hidden",
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />

      {/* Sidebar — fixed drawer on mobile, static column on lg+ */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-72 h-dvh border-r border-border bg-surface/95 backdrop-blur-md flex flex-col transition-transform print:hidden",
          "lg:static lg:h-auto lg:w-64 lg:bg-surface/40 lg:translate-x-0 lg:flex-shrink-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3" aria-label="Trellee admin">
            <Logo size="sm" />
            <span className="t-mono text-muted text-xs uppercase tracking-wider">
              admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-muted hover:text-fg hover:bg-surface-2 transition"
            aria-label="Close admin menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-5 mono-tag mb-2">{section.label}</div>
              <ul className="px-2 space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md t-small transition",
                          active
                            ? "bg-surface-2 text-fg border border-border"
                            : "text-muted hover:text-fg hover:bg-surface-2/60 border border-transparent",
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {active ? <ChevronRight className="w-3.5 h-3.5" /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="t-mono text-muted text-xs px-2 py-2 truncate">
            {userEmail ?? "not signed in"}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md t-small text-muted hover:text-fg hover:bg-surface-2 transition"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </form>
          <Link
            href="/"
            target="_blank"
            className="block mt-1 px-3 py-2 t-mono text-muted text-xs hover:text-fg transition"
          >
            ↗ view live site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
