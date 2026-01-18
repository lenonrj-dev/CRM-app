"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/auth-context";
import { Button } from "../ui/Button";
import { toInitials } from "../../lib/utils";
import { formatEnumLabel } from "../../lib/labels";
import { NotificationBell } from "../../features/notifications/NotificationBell";
import { GlobalSearch } from "../shared/GlobalSearch";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-shell)]/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent-strong)]">
            {toInitials(user?.name)}
          </div>
          <div className="hidden text-left text-sm leading-tight sm:block">
            <p className="font-semibold">{user?.name ?? "Usuário"}</p>
            <p className="text-xs text-[var(--color-muted)]">
              {user?.role ? formatEnumLabel(user.role) : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" aria-label="Sair" onClick={logout}>
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
