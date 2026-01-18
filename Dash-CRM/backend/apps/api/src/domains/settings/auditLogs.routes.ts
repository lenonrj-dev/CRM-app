import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { AuditLog } from "./auditLog.model";

const router = Router();

const filterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

router.get(
  "/",
  requireAuth,
  requirePermission("audit:read"),
  asyncHandler(async (req, res) => {
    const filters = filterSchema.parse({
      userId: req.query.userId,
      action: req.query.action,
      entity: req.query.entity,
      entityId: req.query.entityId,
      start: req.query.start,
      end: req.query.end,
    });

    const query: Record<string, any> = { orgId: req.user!.orgId };
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.entity) query.entity = filters.entity;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.start || filters.end) {
      query.createdAt = {};
      if (filters.start) query.createdAt.$gte = new Date(filters.start);
      if (filters.end) query.createdAt.$lte = new Date(filters.end);
    }

    const items = await AuditLog.find(query).sort({ createdAt: -1 }).limit(200).lean();

    res.json({
      items: items.map((log) => ({
        id: log._id.toString(),
        orgId: log.orgId.toString(),
        userId: log.userId.toString(),
        role: log.role,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        summary: log.summary,
        changes: log.changes,
        ip: log.ip,
        userAgent: log.userAgent,
        hash: log.hash,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  }),
);

export { router as auditLogRoutes };
