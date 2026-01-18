import { Router } from "express";
import { z } from "zod";
import { lifecycleStageValues, onboardingItemStatusValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission, requireRole } from "../../middleware/requirePermission";
import { CustomerSuccessProfile } from "./csProfile.model";
import { calculateHealthScore } from "./health.service";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { emitEvent } from "../events/event.service";

const router = Router();

const onboardingItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  status: z.enum(onboardingItemStatusValues),
  dueDate: z.string().datetime().optional(),
});

const profileSchema = z.object({
  companyId: z.string().min(1),
  lifecycleStage: z.enum(lifecycleStageValues),
  ownerId: z.string().optional(),
  onboardingChecklist: z.array(onboardingItemSchema).optional(),
});

const toProfileDto = (profile: any) => ({
  id: profile._id.toString(),
  orgId: profile.orgId.toString(),
  companyId: profile.companyId.toString(),
  lifecycleStage: profile.lifecycleStage,
  healthScore: profile.healthScore,
  healthBreakdown: profile.healthBreakdown,
  ownerId: profile.ownerId?.toString(),
  onboardingChecklist: profile.onboardingChecklist,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});

router.get(
  "/profiles",
  requireAuth,
  requirePermission("cs:read"),
  asyncHandler(async (req, res) => {
    const items = await CustomerSuccessProfile.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({ items: items.map(toProfileDto) });
  }),
);

router.post(
  "/profiles",
  requireAuth,
  requirePermission("cs:write"),
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    const { score, breakdown } = await calculateHealthScore({ orgId: req.user!.orgId, companyId: data.companyId });

    const profile = await CustomerSuccessProfile.create({
      orgId: req.user!.orgId,
      companyId: data.companyId,
      lifecycleStage: data.lifecycleStage,
      healthScore: score,
      healthBreakdown: breakdown,
      ownerId: data.ownerId,
      onboardingChecklist: data.onboardingChecklist ?? [],
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "cs-profile",
      entityId: profile._id.toString(),
      summary: "Perfil de CS criado",
    });

    res.status(201).json({ profile: toProfileDto(profile) });
  }),
);

router.get(
  "/profiles/:companyId",
  requireAuth,
  requirePermission("cs:read"),
  asyncHandler(async (req, res) => {
    const profile = await CustomerSuccessProfile.findOne({
      orgId: req.user!.orgId,
      companyId: req.params.companyId,
    }).lean();
    if (!profile) throw notFound("Perfil de CS não encontrado");
    res.json({ profile: toProfileDto(profile) });
  }),
);

router.patch(
  "/profiles/:companyId",
  requireAuth,
  requirePermission("cs:write"),
  asyncHandler(async (req, res) => {
    const data = profileSchema.partial().parse(req.body);
    const profile = await CustomerSuccessProfile.findOne({
      orgId: req.user!.orgId,
      companyId: req.params.companyId,
    });
    if (!profile) throw notFound("Perfil de CS não encontrado");

    if (data.lifecycleStage) profile.lifecycleStage = data.lifecycleStage;
    if (data.ownerId !== undefined) profile.ownerId = data.ownerId as any;
    if (data.onboardingChecklist) {
      profile.onboardingChecklist = data.onboardingChecklist.map((item) => ({
        title: item.title,
        status: item.status,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      }));
    }

    await profile.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "cs-profile",
      entityId: profile._id.toString(),
      summary: "Perfil de CS atualizado",
    });

    res.json({ profile: toProfileDto(profile) });
  }),
);

router.post(
  "/health/recalculate/:companyId",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER"]),
  asyncHandler(async (req, res) => {
    const profile = await CustomerSuccessProfile.findOne({
      orgId: req.user!.orgId,
      companyId: req.params.companyId,
    });
    if (!profile) throw notFound("Perfil de CS não encontrado");

    const previousScore = profile.healthScore;
    const { score, breakdown } = await calculateHealthScore({
      orgId: req.user!.orgId,
      companyId: req.params.companyId,
    });

    profile.healthScore = score;
    profile.healthBreakdown = breakdown as any;
    await profile.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "cs-health",
      entityId: profile._id.toString(),
      summary: `Pontuação de saúde recalculada (${previousScore} -> ${score})`,
    });

    if (previousScore >= 60 && score < 60) {
      await emitEvent({
        orgId: req.user!.orgId,
        type: "health.score_dropped",
        payload: {
          companyId: profile.companyId.toString(),
          score,
          initiatedBy: { userId: req.user!.id, role: req.user!.role },
        },
      });
    }

    res.json({ profile: toProfileDto(profile) });
  }),
);

export { router as csProfileRoutes };
