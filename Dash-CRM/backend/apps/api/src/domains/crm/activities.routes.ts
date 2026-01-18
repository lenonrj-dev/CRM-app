import { Router } from "express";
import { z } from "zod";
import { activityTypeValues, visibilityScopeValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Activity } from "./activity.model";
import { buildDiff } from "../../utils/diff";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { buildVisibilityQuery } from "../security/authorization.service";

const router = Router();

const activitySchema = z.object({
  type: z.enum(activityTypeValues),
  subject: z.string().min(2),
  dueDate: z.string().datetime().optional(),
  completed: z.boolean().optional(),
  notes: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  ownerId: z.string().optional(),
  unitId: z.string().optional(),
  teamId: z.string().optional(),
  visibilityScope: z.enum(visibilityScopeValues).optional(),
});

const toActivityDto = (activity: any) => ({
  id: activity._id.toString(),
  orgId: activity.orgId.toString(),
  type: activity.type,
  subject: activity.subject,
  dueDate: activity.dueDate?.toISOString(),
  completed: activity.completed,
  notes: activity.notes,
  contactId: activity.contactId?.toString(),
  companyId: activity.companyId?.toString(),
  dealId: activity.dealId?.toString(),
  ownerId: activity.ownerId?.toString(),
  unitId: activity.unitId?.toString(),
  teamId: activity.teamId?.toString(),
  visibilityScope: activity.visibilityScope,
  createdAt: activity.createdAt.toISOString(),
  updatedAt: activity.updatedAt.toISOString(),
});

const resolveDefaults = (req: any, data: z.infer<typeof activitySchema>) => {
  const unitId = data.unitId ?? req.user!.unitId;
  const teamId = data.teamId ?? req.user!.teamIds?.[0];
  const visibilityScope = data.visibilityScope ?? (teamId ? "TEAM" : unitId ? "UNIT" : "ORG");
  const ownerId = data.ownerId ?? req.user!.id;
  return { unitId, teamId, visibilityScope, ownerId };
};

router.get(
  "/",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const items = await Activity.find({
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: items.map(toActivityDto) });
  }),
);

router.post(
  "/",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = activitySchema.parse(req.body);
    const defaults = resolveDefaults(req, data);
    const activity = await Activity.create({
      ...data,
      ...defaults,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      orgId: req.user!.orgId,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "activity",
      entityId: activity._id.toString(),
      summary: `Atividade ${activity.subject} criada`,
    });

    res.status(201).json({ activity: toActivityDto(activity) });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const activity = await Activity.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    }).lean();
    if (!activity) throw notFound("Atividade não encontrada");
    res.json({ activity: toActivityDto(activity) });
  }),
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = activitySchema.partial().parse(req.body);
    const activity = await Activity.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!activity) throw notFound("Atividade não encontrada");

    const before = activity.toObject();
    Object.assign(activity, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : activity.dueDate,
    });
    await activity.save();

    const changes = buildDiff(before, activity.toObject(), [
      "type",
      "subject",
      "dueDate",
      "completed",
      "notes",
      "contactId",
      "companyId",
      "dealId",
      "ownerId",
      "unitId",
      "teamId",
      "visibilityScope",
    ]);

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "activity",
      entityId: activity._id.toString(),
      summary: `Atividade ${activity.subject} atualizada`,
      changes,
    });

    res.json({ activity: toActivityDto(activity) });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!activity) throw notFound("Atividade não encontrada");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "activity",
      entityId: activity._id.toString(),
      summary: `Atividade ${activity.subject} excluída`,
    });

    res.json({ ok: true });
  }),
);

export { router as activityRoutes };
