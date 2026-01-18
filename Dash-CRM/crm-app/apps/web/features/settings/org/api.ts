import { apiFetch } from "../../../lib/api";
import type { OrganizationDTO, TeamDTO, TerritoryDTO, UnitDTO, UserMembershipDTO } from "@ateliux/shared";

export const listUnits = () => apiFetch<{ items: UnitDTO[] }>("/settings/org/units");
export const createUnit = (payload: Partial<UnitDTO>) =>
  apiFetch<{ unit: UnitDTO }>("/settings/org/units", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateUnit = (id: string, payload: Partial<UnitDTO>) =>
  apiFetch<{ unit: UnitDTO }>(`/settings/org/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const deleteUnit = (id: string) =>
  apiFetch(`/settings/org/units/${id}`, { method: "DELETE" });

export const listTeams = () => apiFetch<{ items: TeamDTO[] }>("/settings/org/teams");
export const createTeam = (payload: Partial<TeamDTO>) =>
  apiFetch<{ team: TeamDTO }>("/settings/org/teams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateTeam = (id: string, payload: Partial<TeamDTO>) =>
  apiFetch<{ team: TeamDTO }>(`/settings/org/teams/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const deleteTeam = (id: string) =>
  apiFetch(`/settings/org/teams/${id}`, { method: "DELETE" });

export const listTerritories = () => apiFetch<{ items: TerritoryDTO[] }>("/settings/org/territories");
export const createTerritory = (payload: Partial<TerritoryDTO>) =>
  apiFetch<{ territory: TerritoryDTO }>("/settings/org/territories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateTerritory = (id: string, payload: Partial<TerritoryDTO>) =>
  apiFetch<{ territory: TerritoryDTO }>(`/settings/org/territories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const deleteTerritory = (id: string) =>
  apiFetch(`/settings/org/territories/${id}`, { method: "DELETE" });

export const listMembers = () => apiFetch<{ items: Array<UserMembershipDTO & { user?: { id: string; name: string; email: string; role: string } | null }> }>("/settings/org/members");
export const createMember = (payload: Partial<UserMembershipDTO> & { userId: string }) =>
  apiFetch<{ membership: UserMembershipDTO }>("/settings/org/members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateMember = (id: string, payload: Partial<UserMembershipDTO>) =>
  apiFetch<{ membership: UserMembershipDTO }>(`/settings/org/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const getOrganization = () =>
  apiFetch<{ organization: OrganizationDTO }>("/settings/org");

export const updateOrganization = (payload: Partial<OrganizationDTO>) =>
  apiFetch<{ organization: OrganizationDTO }>("/settings/org", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
