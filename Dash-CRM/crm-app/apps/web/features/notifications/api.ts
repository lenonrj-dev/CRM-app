import type { NotificationDTO } from "@ateliux/shared";
import { apiFetch, type ApiFetchOptions } from "../../lib/api";

export const listNotifications = (unread?: boolean, options?: ApiFetchOptions) =>
  apiFetch<{ items: NotificationDTO[] }>(`/notifications${unread ? "?unread=true" : ""}`, options);

export const markNotificationsRead = (ids: string[]) =>
  apiFetch<{ ok: boolean }>("/notifications", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });

export const markNotificationRead = (id: string) =>
  apiFetch<{ notification: NotificationDTO }>(`/notifications/${id}`, {
    method: "PATCH",
  });
