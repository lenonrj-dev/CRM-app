import type { Role } from "./permissions";

export type InviteStatus = "PENDING" | "USED" | "EXPIRED";

export type InviteDTO = {
  id: string;
  orgId: string;
  email: string;
  role: Role;
  status: InviteStatus;
  token?: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt: string;
};

export type CreateInviteDTO = {
  email: string;
  role: Role;
  expiresInDays?: number;
};

export type AcceptInviteDTO = {
  token: string;
  name: string;
  password: string;
};
