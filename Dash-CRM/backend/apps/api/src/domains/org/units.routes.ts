import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Unit } from "./unit.model";
import { notFound } from "../../utils/apiError";
import { logAuditEvent } from "../../utils/audit";

const router = Router();

const unitSchema = z.object({
  name: z.string().min(2),
  region: z.string().optional(),
});

router.get(
  "/units",
  requireAuth,
  requirePermission("org:read"),
  asyncHandler(async (req, res) => {
    const items = await Unit.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({
      items: items.map((unit) => ({
        id: unit._id.toString(),
        orgId: unit.orgId.toString(),
        name: unit.name,
        region: unit.region,
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString(),
      })),
    });
  }),
);

router.post(
  "/units",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const data = unitSchema.parse(req.body);
    const unit = await Unit.create({ ...data, orgId: req.user!.orgId });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "unit",
      entityId: unit._id.toString(),
      summary: `Unidade ${unit.name} criada`,
    });

    res.status(201).json({
      unit: {
        id: unit._id.toString(),
        orgId: unit.orgId.toString(),
        name: unit.name,
        region: unit.region,
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString(),
      },
    });
  }),
);

router.patch(
  "/units/:id",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const updates = unitSchema.partial().parse(req.body);
    const unit = await Unit.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!unit) throw notFound("Unidade não encontrada");

    Object.assign(unit, updates);
    await unit.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "unit",
      entityId: unit._id.toString(),
      summary: `Unidade ${unit.name} atualizada`,
    });

    res.json({
      unit: {
        id: unit._id.toString(),
        orgId: unit.orgId.toString(),
        name: unit.name,
        region: unit.region,
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString(),
      },
    });
  }),
);

router.delete(
  "/units/:id",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const unit = await Unit.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!unit) throw notFound("Unidade não encontrada");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "unit",
      entityId: unit._id.toString(),
      summary: `Unidade ${unit.name} excluída`,
    });

    res.json({ ok: true });
  }),
);

export { router as unitRoutes };
