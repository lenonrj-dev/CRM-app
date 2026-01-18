import { permissionsByRole, type Permission, type Role } from "@ateliux/shared";

export const hasPermission = (role: Role | undefined, permission: Permission) => {
  if (!role) return false;
  return (permissionsByRole[role] ?? []).includes(permission);
};
