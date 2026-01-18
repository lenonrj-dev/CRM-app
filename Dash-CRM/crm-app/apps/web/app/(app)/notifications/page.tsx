"use client";

import { useEffect, useState } from "react";
import type { NotificationDTO } from "@ateliux/shared";
import { PageHeader } from "../../../components/shared/PageHeader";
import { RequirePermission } from "../../../components/shared/RequirePermission";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { listNotifications, markNotificationsRead } from "../../../features/notifications/api";
import { formatDateTime } from "../../../lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await listNotifications();
      setNotifications(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAll = async () => {
    const unreadIds = notifications.filter((item) => !item.readAt).map((item) => item.id);
    if (!unreadIds.length) return;
    await markNotificationsRead(unreadIds);
    await loadNotifications();
  };

  return (
    <RequirePermission permission="notifications:read">
      <div className="space-y-6">
        <PageHeader
          title="Notificações"
          subtitle="Acompanhe alertas de automação e vendas."
          actions={
            <Button variant="secondary" size="sm" onClick={handleMarkAll}>
              Marcar tudo como lido
            </Button>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando notificações...</p> : null}

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.readAt ? "opacity-70" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">{formatDateTime(notification.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{notification.message}</p>
              </CardContent>
            </Card>
          ))}
          {!notifications.length && !loading ? (
            <p className="text-sm text-[var(--color-muted)]">Nenhuma notificação ainda.</p>
          ) : null}
        </div>
      </div>
    </RequirePermission>
  );
}
