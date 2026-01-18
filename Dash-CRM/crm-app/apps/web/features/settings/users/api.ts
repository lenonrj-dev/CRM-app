import type { Role, UserDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listUsers = () => apiFetch<{ items: UserDTO[] }>("/users");

export const createUser = (payload: { name: string; email: string; password: string; role: Role }) =>
  apiFetch<{ user: UserDTO }>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateUser = (id: string, payload: { name?: string; role?: Role }) =>
  apiFetch<{ user: UserDTO }>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
