import type { NextFunction, Request, Response } from "express";
import { forbidden, unauthorized } from "../utils/apiError";
import { type Permission, type Role } from "@ateliux/shared";
import { can } from "../domains/security/authorization.service";
import { env } from "../config/env";

const logAuthz = (req: Request, message: string, permission?: string) => {
  if (env.nodeEnv === "production") return;
  // eslint-disable-next-line no-console
  console.warn("[authz] Acesso negado", {
    message,
    permission,
    role: req.user?.role,
    method: req.method,
    path: req.originalUrl,
  });
};

export const requireRole = (roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    logAuthz(req, "Usuario nao autenticado");
    return next(unauthorized());
  }
  if (!roles.includes(req.user.role)) {
    logAuthz(req, "Role sem permissao", roles.join(","));
    return next(forbidden());
  }
  return next();
};

export const requirePermission = (permission: Permission) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      logAuthz(req, "Usuario nao autenticado", permission);
      return next(unauthorized());
    }
    if (!can(req.user, permission)) {
      logAuthz(req, "Permissao insuficiente", permission);
      return next(forbidden());
    }
    return next();
  };