import type { Permission, Role, VisibilityScope } from "@ateliux/shared";
import { permissionsByRole } from "@ateliux/shared";

export type AuthUser = {
  id: string;
  role: Role;
  orgId: string;
  unitId?: string;
  teamIds?: string[];
  scope?: VisibilityScope;
};

type VisibilityOptions = {
  visibilityField?: string;
  unitField?: string;
  teamField?: string;
  ownerField?: string;
};

const restrictedFields: Record<string, Partial<Record<Role, string[]>>> = {
  deal: {
    VIEWER: ["value"],
    CLIENT: ["value"],
  },
  proposal: {
    VIEWER: ["subtotal", "total", "discountValue"],
    CLIENT: ["subtotal", "total", "discountValue"],
  },
  contract: {
    VIEWER: ["value"],
    CLIENT: ["value"],
  },
};

export const can = (user: AuthUser, permission: Permission) => {
  const allowed = permissionsByRole[user.role] ?? [];
  return allowed.includes(permission);
};

export const buildVisibilityQuery = (user: AuthUser, options: VisibilityOptions = {}) => {
  if (user.role === "OWNER" || user.role === "ADMIN" || user.role === "MANAGER") return {};
  if (user.scope === "ORG") return {};
  const visibilityField = options.visibilityField ?? "visibilityScope";
  const unitField = options.unitField ?? "unitId";
  const teamField = options.teamField ?? "teamId";
  const ownerField = options.ownerField ?? "ownerId";

  const scope = user.scope ?? "ORG";
  const orConditions: Record<string, any>[] = [{ [visibilityField]: "ORG" }];

  if (scope === "UNIT" && user.unitId) {
    orConditions.push({ [visibilityField]: "UNIT", [unitField]: user.unitId });
  }

  if ((scope === "UNIT" || scope === "TEAM") && user.teamIds?.length) {
    orConditions.push({ [visibilityField]: "TEAM", [teamField]: { $in: user.teamIds } });
  }

  if (scope === "UNIT" || scope === "TEAM" || scope === "OWNED_ONLY") {
    orConditions.push({ [visibilityField]: "OWNED_ONLY", [ownerField]: user.id });
  }
  return { $or: orConditions };
};

export const filterFields = <T>(user: AuthUser, resource: string, data: T): T => {
  const fields = restrictedFields[resource]?.[user.role];
  if (!fields || fields.length === 0) return data;
  const remove = (item: any) => {
    const clone = { ...(item as Record<string, unknown>) };
    fields.forEach((field) => {
      delete clone[field];
    });
    return clone;
  };
  if (Array.isArray(data)) {
    return data.map(remove) as T;
  }
  if (data && typeof data === "object") {
    return remove(data) as T;
  }
  return data;
};
