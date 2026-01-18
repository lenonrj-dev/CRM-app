import type { ContactDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listContacts = () => apiFetch<{ items: ContactDTO[] }>("/contacts");

export const getContact = (id: string) => apiFetch<{ contact: ContactDTO }>(`/contacts/${id}`);

export const createContact = (payload: Partial<ContactDTO>) =>
  apiFetch<{ contact: ContactDTO }>("/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateContact = (id: string, payload: Partial<ContactDTO>) =>
  apiFetch<{ contact: ContactDTO }>(`/contacts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteContact = (id: string) =>
  apiFetch<{ ok: boolean }>(`/contacts/${id}`, { method: "DELETE" });
