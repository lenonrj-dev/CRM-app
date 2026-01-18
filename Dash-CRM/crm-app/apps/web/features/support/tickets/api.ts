import type { TicketDTO } from "@ateliux/shared";
import { apiFetch, type ApiFetchOptions } from "../../../lib/api";

export const listTickets = (params?: { status?: string; priority?: string }, options?: ApiFetchOptions) => {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.priority) search.set("priority", params.priority);
  const query = search.toString();
  return apiFetch<{ items: TicketDTO[] }>(`/tickets${query ? `?${query}` : ""}`, options);
};

export const getTicket = (id: string) => apiFetch<{ ticket: TicketDTO }>(`/tickets/${id}`);

export const createTicket = (payload: Partial<TicketDTO>) =>
  apiFetch<{ ticket: TicketDTO }>("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateTicket = (id: string, payload: Partial<TicketDTO>) =>
  apiFetch<{ ticket: TicketDTO }>(`/tickets/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const addTicketComment = (id: string, payload: { body: string; isInternal?: boolean }) =>
  apiFetch<{ ticket: TicketDTO }>(`/tickets/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteTicket = (id: string) => apiFetch<{ ok: boolean }>(`/tickets/${id}`, { method: "DELETE" });