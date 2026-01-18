import type { CreateInviteDTO, InviteDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listInvites = () => apiFetch<{ items: InviteDTO[] }>("/settings/invites");

export const createInvite = (payload: CreateInviteDTO) =>
  apiFetch<{ invite: InviteDTO }>("/settings/invites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
