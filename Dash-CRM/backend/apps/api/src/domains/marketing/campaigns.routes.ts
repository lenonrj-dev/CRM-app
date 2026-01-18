import { Router } from "express";
import { z } from "zod";
import { campaignStatusValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Campaign } from "./campaign.model";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";

const router = Router();

const utmSchema = z
  .object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional(),
  })
  .optional();

const campaignSchema = z.object({
  name: z.string().min(2),
  channel: z.string().min(2),
  budget: z.number().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  status: z.enum(campaignStatusValues),
  utm: utmSchema,
});

const toCampaignDto = (campaign: any) => ({
  id: campaign._id.toString(),
  orgId: campaign.orgId.toString(),
  name: campaign.name,
  channel: campaign.channel,
  budget: campaign.budget,
  startAt: campaign.startAt?.toISOString(),
  endAt: campaign.endAt?.toISOString(),
  status: campaign.status,
  utm: campaign.utm,
  createdAt: campaign.createdAt.toISOString(),
  updatedAt: campaign.updatedAt.toISOString(),
});

router.get(
  "/campaigns",
  requireAuth,
  requirePermission("marketing:read"),
  asyncHandler(async (req, res) => {
    const items = await Campaign.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({ items: items.map(toCampaignDto) });
  }),
);

router.post(
  "/campaigns",
  requireAuth,
  requirePermission("marketing:write"),
  asyncHandler(async (req, res) => {
    const data = campaignSchema.parse(req.body);
    const campaign = await Campaign.create({
      ...data,
      orgId: req.user!.orgId,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "campaign",
      entityId: campaign._id.toString(),
      summary: `Campanha ${campaign.name} criada`,
    });

    res.status(201).json({ campaign: toCampaignDto(campaign) });
  }),
);

router.get(
  "/campaigns/:id",
  requireAuth,
  requirePermission("marketing:read"),
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findOne({ _id: req.params.id, orgId: req.user!.orgId }).lean();
    if (!campaign) throw notFound("Campanha não encontrada");
    res.json({ campaign: toCampaignDto(campaign) });
  }),
);

router.patch(
  "/campaigns/:id",
  requireAuth,
  requirePermission("marketing:write"),
  asyncHandler(async (req, res) => {
    const data = campaignSchema.partial().parse(req.body);
    const campaign = await Campaign.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!campaign) throw notFound("Campanha não encontrada");

    Object.assign(campaign, {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : campaign.startAt,
      endAt: data.endAt ? new Date(data.endAt) : campaign.endAt,
    });
    await campaign.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "campaign",
      entityId: campaign._id.toString(),
      summary: `Campanha ${campaign.name} atualizada`,
    });

    res.json({ campaign: toCampaignDto(campaign) });
  }),
);

router.delete(
  "/campaigns/:id",
  requireAuth,
  requirePermission("marketing:write"),
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!campaign) throw notFound("Campanha não encontrada");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "campaign",
      entityId: campaign._id.toString(),
      summary: `Campanha ${campaign.name} excluída`,
    });

    res.json({ ok: true });
  }),
);

export { router as marketingCampaignRoutes };
