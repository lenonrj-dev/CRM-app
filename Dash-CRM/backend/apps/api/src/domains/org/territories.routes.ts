import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Territory } from "./territory.model";
import { notFound } from "../../utils/apiError";
import { logAuditEvent } from "../../utils/audit";

const router = Router();

const ruleSchema = z.object({
  regions: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
});

const territorySchema = z.object({
  name: z.string().min(2),
  unitId: z.string().optional(),
  teamId: z.string().optional(),
  ownerId: z.string().optional(),
  rules: ruleSchema.optional(),
});

router.get(
  "/territories",
  requireAuth,
  requirePermission("org:read"),
  asyncHandler(async (req, res) => {
    const items = await Territory.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({
      items: items.map((territory) => ({
        id: territory._id.toString(),
        orgId: territory.orgId.toString(),
        name: territory.name,
        unitId: territory.unitId?.toString(),
        teamId: territory.teamId?.toString(),
        ownerId: territory.ownerId?.toString(),
        rules: territory.rules,
        createdAt: territory.createdAt.toISOString(),
        updatedAt: territory.updatedAt.toISOString(),
      })),
    });
  }),
);

router.post(
  "/territories",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const data = territorySchema.parse(req.body);
    const territory = await Territory.create({ ...data, orgId: req.user!.orgId });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "territory",
      entityId: territory._id.toString(),
      summary: `Território ${territory.name} criado`,
    });

    res.status(201).json({
      territory: {
        id: territory._id.toString(),
        orgId: territory.orgId.toString(),
        name: territory.name,
        unitId: territory.unitId?.toString(),
        teamId: territory.teamId?.toString(),
        ownerId: territory.ownerId?.toString(),
        rules: territory.rules,
        createdAt: territory.createdAt.toISOString(),
        updatedAt: territory.updatedAt.toISOString(),
      },
    });
  }),
);

router.patch(
  "/territories/:id",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const updates = territorySchema.partial().parse(req.body);
    const territory = await Territory.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!territory) throw notFound("Território não encontrado");

    Object.assign(territory, updates);
    await territory.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "territory",
      entityId: territory._id.toString(),
      summary: `Território ${territory.name} atualizado`,
    });

    res.json({
      territory: {
        id: territory._id.toString(),
        orgId: territory.orgId.toString(),
        name: territory.name,
        unitId: territory.unitId?.toString(),
        teamId: territory.teamId?.toString(),
        ownerId: territory.ownerId?.toString(),
        rules: territory.rules,
        createdAt: territory.createdAt.toISOString(),
        updatedAt: territory.updatedAt.toISOString(),
      },
    });
  }),
);

router.delete(
  "/territories/:id",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const territory = await Territory.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user!.orgId,
    });
    if (!territory) throw notFound("Território não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "territory",
      entityId: territory._id.toString(),
      summary: `Território ${territory.name} excluído`,
    });

    res.json({ ok: true });
  }),
);

export { router as territoryRoutes };
