import type { Role } from "./permissions";

export const visibilityScopeValues = ["ORG", "UNIT", "TEAM", "OWNED_ONLY"] as const;
export type VisibilityScope = typeof visibilityScopeValues[number];

export const membershipStatusValues = ["ACTIVE", "INVITED", "DISABLED"] as const;
export type MembershipStatus = typeof membershipStatusValues[number];

export type UnitDTO = {
  id: string;
  orgId: string;
  name: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamDTO = {
  id: string;
  orgId: string;
  unitId?: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};

export type TerritoryRule = {
  regions?: string[];
  industries?: string[];
  sizes?: string[];
};

export type TerritoryDTO = {
  id: string;
  orgId: string;
  name: string;
  unitId?: string;
  teamId?: string;
  ownerId?: string;
  rules: TerritoryRule;
  createdAt: string;
  updatedAt: string;
};

export type UserMembershipDTO = {
  id: string;
  userId: string;
  orgId: string;
  unitId?: string;
  teamIds?: string[];
  role: Role;
  scope: VisibilityScope;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
};
