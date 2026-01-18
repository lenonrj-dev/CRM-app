"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { navSections } from "../../config/nav";
import { useAuth } from "../../features/auth/auth-context";
import { hasPermission } from "../../config/rbac";
import { Badge } from "../ui/Badge";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 lg:block">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Ateliux</p>
          <p className="mt-1 text-2xl font-semibold">CRM</p>
        </div>
        <Badge variant="accent">Fase 3</Badge>
      </div>

      <nav className="mt-10 space-y-8">
        {navSections.map((section) => {
          const items = section.items.filter(
            (item) => hasPermission(user?.role, item.permission) && (!item.roles || item.roles.includes(user?.role ?? "VIEWER")),
          );
          if (!items.length) return null;

          return (
            <div key={section.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                {section.title}
              </p>
              <div className="mt-3 space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                          : "text-[var(--color-muted)] hover:bg-[#f0ede7] hover:text-[var(--color-ink)]",
                      )}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
