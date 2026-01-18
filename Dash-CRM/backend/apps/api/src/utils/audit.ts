import type { Request } from "express";
import { createHash } from "crypto";
import { AuditLog } from "../domains/settings/auditLog.model";
import type { AuditAction } from "@ateliux/shared";

const getIp = (req: Request) =>
  (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
  req.socket.remoteAddress;

const buildAuditHash = (payload: Record<string, unknown>) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

export const logAuditEvent = async (params: {
  req: Request;
  action: AuditAction;
  entity: string;
  entityId?: string;
  summary?: string;
  changes?: Record<string, { from?: string | number | null; to?: string | number | null }>;
}) => {
  const { req, action, entity, entityId, summary, changes } = params;
  const user = req.user;
  if (!user) return;

  const payload = {
    orgId: user.orgId,
    userId: user.id,
    role: user.role,
    action,
    entity,
    entityId,
    summary,
    changes,
    ip: getIp(req),
    userAgent: req.headers["user-agent"],
  };

  await AuditLog.create({
    ...payload,
    hash: buildAuditHash(payload),
  });
};
