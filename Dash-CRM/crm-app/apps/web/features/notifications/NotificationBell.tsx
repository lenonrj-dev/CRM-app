"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { NotificationDTO } from "@ateliux/shared";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { listNotifications, markNotificationsRead } from "./api";
import { formatDateTime } from "../../lib/utils";
import { useAuth } from "../auth/auth-context";
import { hasPermission } from "../../config/rbac";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const canReadNotifications = hasPermission(user?.role, "notifications:read");

  const loadNotifications = async (signal?: AbortSignal) => {
    if (!user || !canReadNotifications) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listNotifications(false, { signal });
      setItems(data.items);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) {
        setItems([]);
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("[notifications] Erro ao carregar", { status });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    void loadNotifications(controller.signal);
    return () => controller.abort();
  }, [authLoading, user, canReadNotifications]);

  const unreadIds = items.filter((item) => !item.readAt).map((item) => item.id);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && user && canReadNotifications) {
      await loadNotifications();
    }
  };

  const handleMarkAll = async () => {
    if (!unreadIds.length || !user || !canReadNotifications) return;
    await markNotificationsRead(unreadIds);
    await loadNotifications();
  };

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" pill aria-label="Notificações" onClick={handleToggle}>
        <Bell size={16} />
      </Button>
      {unreadIds.length ? (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-semibold text-white">
          {unreadIds.length}
        </span>
      ) : null}
      {open ? (
        <Card className="absolute right-0 mt-3 w-80 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Notificações</p>
            <button
              type="button"
              className="text-xs font-semibold text-[var(--color-accent-strong)]"
              onClick={handleMarkAll}
            >
              Marcar tudo como lido
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando...</p> : null}
            {!loading && !items.length ? (
              <p className="text-sm text-[var(--color-muted)]">Nenhuma notificação ainda.</p>
            ) : null}
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{item.message}</p>
                <p className="mt-2 text-[10px] text-[var(--color-muted)]">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <Link href="/notifications" className="text-xs font-semibold text-[var(--color-accent-strong)]">
              Ver todas
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
