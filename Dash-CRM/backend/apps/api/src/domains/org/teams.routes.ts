import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Team } from "./team.model";
import { notFound } from "../../utils/apiError";
import { logAuditEvent } from "../../utils/audit";

const router = Router();

const teamSchema = z.object({
  name: z.string().min(2),
  unitId: z.string().optional(),
  color: z.string().optional(),
});

router.get(
  "/teams",
  requireAuth,
  requirePermission("org:read"),
  asyncHandler(async (req, res) => {
    const items = await Team.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({
      items: items.map((team) => ({
        id: team._id.toString(),
        orgId: team.orgId.toString(),
        unitId: team.unitId?.toString(),
        name: team.name,
        color: team.color,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      })),
    });
  }),
);

router.post(
  "/teams",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const data = teamSchema.parse(req.body);
    const team = await Team.create({ ...data, orgId: req.user!.orgId });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "team",
      entityId: team._id.toString(),
      summary: `Time ${team.name} criado`,
    });

    res.status(201).json({
      team: {
        id: team._id.toString(),
        orgId: team.orgId.toString(),
        unitId: team.unitId?.toString(),
        name: team.name,
        color: team.color,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      },
    });
  }),
);

router.patch(
  "/teams/:id",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const updates = teamSchema.partial().parse(req.body);
    const team = await Team.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!team) throw notFound("Time não encontrado");

    Object.assign(team, updates);
    await team.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "team",
      entityId: team._id.toString(),
      summary: `Time ${team.name} atualizado`,
    });

    res.json({
      team: {
        id: team._id.toString(),
        orgId: team.orgId.toString(),
        unitId: team.unitId?.toString(),
        name: team.name,
        color: team.color,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString(),
      },
    });
  }),
);

router.delete(
  "/teams/:id",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const team = await Team.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!team) throw notFound("Time não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "team",
      entityId: team._id.toString(),
      summary: `Time ${team.name} excluído`,
    });

    res.json({ ok: true });
  }),
);

export { router as teamRoutes };
