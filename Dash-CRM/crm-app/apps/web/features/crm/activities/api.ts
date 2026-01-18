import type { ActivityDTO } from "@ateliux/shared";
import { apiFetch, type ApiFetchOptions } from "../../../lib/api";

export const listActivities = (options?: ApiFetchOptions) =>
  apiFetch<{ items: ActivityDTO[] }>("/activities", options);

export const getActivity = (id: string) => apiFetch<{ activity: ActivityDTO }>(`/activities/${id}`);

export const createActivity = (payload: Partial<ActivityDTO>) =>
  apiFetch<{ activity: ActivityDTO }>("/activities", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateActivity = (id: string, payload: Partial<ActivityDTO>) =>
  apiFetch<{ activity: ActivityDTO }>(`/activities/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteActivity = (id: string) =>
  apiFetch<{ ok: boolean }>(`/activities/${id}`, { method: "DELETE" });