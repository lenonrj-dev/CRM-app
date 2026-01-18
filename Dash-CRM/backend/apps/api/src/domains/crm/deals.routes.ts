import { Router } from "express";
import { z } from "zod";
import { dealStageValues, visibilityScopeValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Deal } from "./deal.model";
import { Company } from "./company.model";
import { buildDiff } from "../../utils/diff";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { calculateDealScore } from "../marketing/scoring.service";
import { emitEvent } from "../events/event.service";
import { buildVisibilityQuery, filterFields } from "../security/authorization.service";
import { matchTerritory } from "../org/territory.service";

const router = Router();

const attributionSchema = z
  .object({
    firstTouch: z
      .object({
        utm: z
          .object({
            source: z.string().optional(),
            medium: z.string().optional(),
            campaign: z.string().optional(),
            term: z.string().optional(),
            content: z.string().optional(),
          })
          .optional(),
        landingPage: z.string().optional(),
        referrer: z.string().optional(),
        createdFrom: z.string().optional(),
        timestamp: z.string().datetime().optional(),
      })
      .optional(),
    lastTouch: z
      .object({
        utm: z
          .object({
            source: z.string().optional(),
            medium: z.string().optional(),
            campaign: z.string().optional(),
            term: z.string().optional(),
            content: z.string().optional(),
          })
          .optional(),
        landingPage: z.string().optional(),
        referrer: z.string().optional(),
        createdFrom: z.string().optional(),
        timestamp: z.string().datetime().optional(),
      })
      .optional(),
  })
  .optional();

const dealSchema = z.object({
  name: z.string().min(2),
  stage: z.enum(dealStageValues),
  value: z.number().min(0),
  expectedCloseDate: z.string().datetime().optional(),
  ownerId: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  unitId: z.string().optional(),
  teamId: z.string().optional(),
  visibilityScope: z.enum(visibilityScopeValues).optional(),
  lostReason: z.string().optional(),
  createdFrom: z.string().optional(),
  attribution: attributionSchema,
});

const toDealDto = (deal: any) => ({
  id: deal._id.toString(),
  orgId: deal.orgId.toString(),
  name: deal.name,
  stage: deal.stage,
  value: deal.value,
  expectedCloseDate: deal.expectedCloseDate?.toISOString(),
  ownerId: deal.ownerId?.toString(),
  companyId: deal.companyId?.toString(),
  contactId: deal.contactId?.toString(),
  unitId: deal.unitId?.toString(),
  teamId: deal.teamId?.toString(),
  visibilityScope: deal.visibilityScope,
  lostReason: deal.lostReason,
  createdFrom: deal.createdFrom,
  attribution: deal.attribution,
  leadScore: deal.leadScore,
  createdAt: deal.createdAt.toISOString(),
  updatedAt: deal.updatedAt.toISOString(),
});

const updateDealScore = (deal: any) => {
  deal.leadScore = calculateDealScore({
    id: deal._id.toString(),
    orgId: deal.orgId.toString(),
    name: deal.name,
    stage: deal.stage,
    value: deal.value,
    expectedCloseDate: deal.expectedCloseDate?.toISOString(),
    ownerId: deal.ownerId?.toString(),
    companyId: deal.companyId?.toString(),
    contactId: deal.contactId?.toString(),
    lostReason: deal.lostReason,
    createdFrom: deal.createdFrom,
    attribution: deal.attribution as any,
    leadScore: deal.leadScore as any,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  }) as any;
};

const resolveDefaults = async (req: any, data: z.infer<typeof dealSchema>) => {
  const company = data.companyId
    ? await Company.findOne({ _id: data.companyId, orgId: req.user!.orgId }).lean()
    : null;
  const territory = await matchTerritory(req.user!.orgId, {
    industry: company?.industry,
    size: company?.size,
    region: company?.region,
  });

  const unitId = data.unitId ?? company?.unitId?.toString() ?? territory?.unitId?.toString() ?? req.user!.unitId;
  const teamId = data.teamId ?? company?.teamId?.toString() ?? territory?.teamId?.toString() ?? req.user!.teamIds?.[0];
  const visibilityScope =
    data.visibilityScope ?? company?.visibilityScope ?? (teamId ? "TEAM" : unitId ? "UNIT" : "ORG");
  const ownerId =
    data.ownerId ?? company?.ownerId?.toString() ?? territory?.ownerId?.toString();

  return { unitId, teamId, visibilityScope, ownerId };
};

router.get(
  "/",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const items = await Deal.find({
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    })
      .sort({ createdAt: -1 })
      .lean();
    const filtered = filterFields(req.user!, "deal", items.map(toDealDto));
    res.json({ items: filtered });
  }),
);

router.post(
  "/",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = dealSchema.parse(req.body);
    const defaults = await resolveDefaults(req, data);
    const deal = await Deal.create({
      ...data,
      ...defaults,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      orgId: req.user!.orgId,
    });
    updateDealScore(deal);
    await deal.save();

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "deal",
      entityId: deal._id.toString(),
      summary: `Oportunidade ${deal.name} criada`,
    });

    res.status(201).json({ deal: filterFields(req.user!, "deal", toDealDto(deal)) });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const deal = await Deal.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    }).lean();
    if (!deal) throw notFound("Oportunidade não encontrada");
    res.json({ deal: filterFields(req.user!, "deal", toDealDto(deal)) });
  }),
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = dealSchema.partial().parse(req.body);
    const deal = await Deal.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!deal) throw notFound("Oportunidade não encontrada");

    const before = deal.toObject();
    Object.assign(deal, {
      ...data,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : deal.expectedCloseDate,
    });
    updateDealScore(deal);
    await deal.save();

    const changes = buildDiff(before, deal.toObject(), [
      "name",
      "stage",
      "value",
      "expectedCloseDate",
      "ownerId",
      "companyId",
      "contactId",
      "unitId",
      "teamId",
      "visibilityScope",
      "lostReason",
      "createdFrom",
    ]);

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "deal",
      entityId: deal._id.toString(),
      summary: `Oportunidade ${deal.name} atualizada`,
      changes,
    });

    const stageChanged = before.stage !== deal.stage;
    await emitEvent({
      orgId: req.user!.orgId,
      type: "deal.updated",
      payload: {
        dealId: deal._id.toString(),
        companyId: deal.companyId?.toString(),
        contactId: deal.contactId?.toString(),
        ownerId: deal.ownerId?.toString(),
        stage: deal.stage,
        stageChanged,
        initiatedBy: { userId: req.user!.id, role: req.user!.role },
      },
    });

    res.json({ deal: filterFields(req.user!, "deal", toDealDto(deal)) });
  }),
);

router.patch(
  "/:id/stage",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const schema = z.object({ stage: z.enum(dealStageValues), lostReason: z.string().optional() });
    const data = schema.parse(req.body);

    const deal = await Deal.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!deal) throw notFound("Oportunidade não encontrada");

    const before = deal.toObject();
    deal.stage = data.stage;
    if (data.lostReason !== undefined) deal.lostReason = data.lostReason;
    updateDealScore(deal);
    await deal.save();

    const changes = buildDiff(before, deal.toObject(), ["stage", "lostReason"]);

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "deal",
      entityId: deal._id.toString(),
      summary: "Etapa da oportunidade alterada",
      changes,
    });

    await emitEvent({
      orgId: req.user!.orgId,
      type: "deal.updated",
      payload: {
        companyId: deal.companyId?.toString(),
        contactId: deal.contactId?.toString(),
        dealId: deal._id.toString(),
        stage: deal.stage,
        ownerId: deal.ownerId?.toString(),
        stageChanged: true,
        initiatedBy: { userId: req.user!.id, role: req.user!.role },
      },
    });

    res.json({ deal: filterFields(req.user!, "deal", toDealDto(deal)) });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const deal = await Deal.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!deal) throw notFound("Oportunidade não encontrada");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "deal",
      entityId: deal._id.toString(),
      summary: `Oportunidade ${deal.name} excluída`,
    });

    res.json({ ok: true });
  }),
);

export { router as dealRoutes };
