import type { CatalogItemDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listCatalogItems = () => apiFetch<{ items: CatalogItemDTO[] }>("/sales/catalog");

export const createCatalogItem = (payload: Partial<CatalogItemDTO>) =>
  apiFetch<{ item: CatalogItemDTO }>("/sales/catalog", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateCatalogItem = (id: string, payload: Partial<CatalogItemDTO>) =>
  apiFetch<{ item: CatalogItemDTO }>(`/sales/catalog/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteCatalogItem = (id: string) =>
  apiFetch<{ ok: boolean }>(`/sales/catalog/${id}`, { method: "DELETE" });
