"use client";

import type { Permission } from "@ateliux/shared";
import { useAuth } from "../../features/auth/auth-context";
import { hasPermission } from "../../config/rbac";

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!hasPermission(user?.role, permission)) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-sm text-[var(--color-muted)]">
        Você não tem acesso a esta seção.
      </div>
    );
  }
  return <>{children}</>;
}
