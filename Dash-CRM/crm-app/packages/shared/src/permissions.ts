export const roleValues = ["OWNER", "ADMIN", "MANAGER", "USER", "VIEWER", "CLIENT"] as const;
export type Role = typeof roleValues[number];

export type Permission =
  | "crm:read"
  | "crm:write"
  | "support:read"
  | "support:write"
  | "users:read"
  | "users:write"
  | "audit:read"
  | "dashboard:read"
  | "marketing:read"
  | "marketing:write"
  | "cs:read"
  | "cs:write"
  | "sales:read"
  | "sales:write"
  | "automation:read"
  | "automation:write"
  | "notifications:read"
  | "security:read"
  | "security:write"
  | "org:read"
  | "org:write"
  | "integrations:read"
  | "integrations:write"
  | "exports:read"
  | "bi:read"
  | "compliance:read"
  | "compliance:write";

export const permissionsByRole: Record<Role, Permission[]> = {
  OWNER: [
    "crm:read",
    "crm:write",
    "support:read",
    "support:write",
    "users:read",
    "users:write",
    "audit:read",
    "dashboard:read",
    "marketing:read",
    "marketing:write",
    "cs:read",
    "cs:write",
    "sales:read",
    "sales:write",
    "automation:read",
    "automation:write",
    "notifications:read",
    "security:read",
    "security:write",
    "org:read",
    "org:write",
    "integrations:read",
    "integrations:write",
    "exports:read",
    "bi:read",
    "compliance:read",
    "compliance:write",
  ],
  ADMIN: [
    "crm:read",
    "crm:write",
    "support:read",
    "support:write",
    "users:read",
    "users:write",
    "audit:read",
    "dashboard:read",
    "marketing:read",
    "marketing:write",
    "cs:read",
    "cs:write",
    "sales:read",
    "sales:write",
    "automation:read",
    "automation:write",
    "notifications:read",
    "security:read",
    "security:write",
    "org:read",
    "org:write",
    "integrations:read",
    "integrations:write",
    "exports:read",
    "bi:read",
    "compliance:read",
    "compliance:write",
  ],
  MANAGER: [
    "crm:read",
    "crm:write",
    "support:read",
    "support:write",
    "audit:read",
    "dashboard:read",
    "marketing:read",
    "marketing:write",
    "cs:read",
    "cs:write",
    "sales:read",
    "sales:write",
    "automation:read",
    "automation:write",
    "notifications:read",
    "users:read",
    "security:read",
    "org:read",
    "integrations:read",
    "exports:read",
    "bi:read",
    "compliance:read",
  ],
  USER: [
    "crm:read",
    "crm:write",
    "dashboard:read",
    "sales:read",
    "sales:write",
    "cs:read",
    "automation:read",
    "notifications:read",
    "support:read",
    "support:write",
    "marketing:read",
    "exports:read",
    "bi:read",
  ],
  VIEWER: [
    "crm:read",
    "support:read",
    "audit:read",
    "dashboard:read",
    "marketing:read",
    "cs:read",
    "sales:read",
    "automation:read",
    "notifications:read",
    "security:read",
    "org:read",
    "integrations:read",
    "exports:read",
    "bi:read",
    "compliance:read",
  ],
  CLIENT: ["support:read", "support:write", "notifications:read"],
};
