import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { unauthorized } from "../utils/apiError";
import { User } from "../domains/auth/user.model";
import { UserMembership } from "../domains/org/membership.model";
import { env } from "../config/env";

const logAuth = (req: Request, message: string) => {
  if (env.nodeEnv === "production") return;
  // eslint-disable-next-line no-console
  console.warn("[auth] Acesso negado", { message, method: req.method, path: req.originalUrl });
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    logAuth(req, "Bearer ausente");
    return next(unauthorized());
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      logAuth(req, "Usuario nao encontrado");
      return next(unauthorized());
    }

    const orgId = payload.orgId ?? user.orgId.toString();
    const membership = await UserMembership.findOne({
      userId: user._id,
      orgId,
      status: "ACTIVE",
    }).lean();
    if (!membership) {
      logAuth(req, "Membership inativa");
      return next(unauthorized());
    }

    req.user = {
      id: user._id.toString(),
      role: membership.role,
      orgId,
      unitId: membership.unitId?.toString(),
      teamIds: membership.teamIds?.map((id) => id.toString()),
      scope: membership.scope ?? "ORG",
    };

    return next();
  } catch (error) {
    logAuth(req, "Token invalido");
    return next(unauthorized());
  }
};