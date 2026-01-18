import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Company } from "./company.model";
import { Contact } from "./contact.model";
import { Deal } from "./deal.model";
import { Activity } from "./activity.model";
import { Ticket } from "../support/ticket.model";
import { AuditLog } from "../settings/auditLog.model";
import { logAuditEvent } from "../../utils/audit";
import { buildDiff } from "../../utils/diff";
import { notFound } from "../../utils/apiError";
import { CustomerSuccessProfile } from "../cs/csProfile.model";
import { Contract } from "../cs/contract.model";
import {
  buildTimeline,
  mapActivity,
  mapContact,
  mapDeal,
  mapTicket,
  toCompanyDto,
} from "./company.mappers";
import { visibilityScopeValues } from "@ateliux/shared";
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

const companySchema = z.object({
  name: z.string().min(2),
  industry: z.string().optional(),
  website: z.string().optional(),
  size: z.string().optional(),
  region: z.string().optional(),
  ownerId: z.string().optional(),
  unitId: z.string().optional(),
  teamId: z.string().optional(),
  visibilityScope: z.enum(visibilityScopeValues).optional(),
  tags: z.array(z.string()).optional(),
  createdFrom: z.string().optional(),
  attribution: attributionSchema,
});

const resolveDefaults = async (req: any, data: z.infer<typeof companySchema>) => {
  const territory = await matchTerritory(req.user!.orgId, {
    industry: data.industry,
    size: data.size,
    region: data.region,
  });

  const unitId = data.unitId ?? territory?.unitId?.toString() ?? req.user!.unitId;
  const teamId = data.teamId ?? territory?.teamId?.toString() ?? req.user!.teamIds?.[0];
  const ownerId = data.ownerId ?? territory?.ownerId?.toString();
  const visibilityScope = data.visibilityScope ?? (teamId ? "TEAM" : unitId ? "UNIT" : "ORG");

  return { unitId, teamId, ownerId, visibilityScope };
};

router.get(
  "/",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const items = await Company.find({
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: items.map(toCompanyDto) });
  }),
);

router.post(
  "/",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = companySchema.parse(req.body);
    const defaults = await resolveDefaults(req, data);
    const company = await Company.create({
      ...data,
      ...defaults,
      orgId: req.user!.orgId,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "company",
      entityId: company._id.toString(),
      summary: `Empresa ${company.name} criada`,
    });

    res.status(201).json({ company: toCompanyDto(company) });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const company = await Company.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    }).lean();
    if (!company) throw notFound("Empresa não encontrada");
    res.json({ company: toCompanyDto(company) });
  }),
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = companySchema.partial().parse(req.body);
    const company = await Company.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!company) throw notFound("Empresa não encontrada");

    const before = company.toObject();
    Object.assign(company, data);
    await company.save();

    const changes = buildDiff(before, company.toObject(), [
      "name",
      "industry",
      "website",
      "size",
      "region",
      "ownerId",
      "unitId",
      "teamId",
      "visibilityScope",
      "tags",
      "createdFrom",
    ]);

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "company",
      entityId: company._id.toString(),
      summary: `Empresa ${company.name} atualizada`,
      changes,
    });

    res.json({ company: toCompanyDto(company) });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const company = await Company.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!company) throw notFound("Empresa não encontrada");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "company",
      entityId: company._id.toString(),
      summary: `Empresa ${company.name} excluída`,
    });

    res.json({ ok: true });
  }),
);

router.get(
  "/:id/overview",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const company = await Company.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    }).lean();
    if (!company) throw notFound("Empresa não encontrada");

    const visibility = buildVisibilityQuery(req.user!);
    const [contacts, deals, activities, tickets, csProfile, contracts] = await Promise.all([
      Contact.find({ orgId: req.user!.orgId, companyId: company._id, ...visibility }).lean(),
      Deal.find({ orgId: req.user!.orgId, companyId: company._id, ...visibility }).lean(),
      Activity.find({ orgId: req.user!.orgId, companyId: company._id, ...visibility }).lean(),
      Ticket.find({ orgId: req.user!.orgId, companyId: company._id, ...visibility }).lean(),
      CustomerSuccessProfile.findOne({ orgId: req.user!.orgId, companyId: company._id }).lean(),
      Contract.find({ orgId: req.user!.orgId, companyId: company._id }).lean(),
    ]);

    const dealIds = deals.map((deal) => deal._id.toString());
    const dealEvents = await AuditLog.find({
      orgId: req.user!.orgId,
      entity: "deal",
      entityId: { $in: dealIds },
      action: "UPDATE",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const renewalEvents = contracts.map((contract) => ({
      id: contract._id.toString(),
      title: "Renovação próxima",
      description: `Contrato termina em ${contract.endAt.toISOString().slice(0, 10)}`,
      occurredAt: contract.endAt,
    }));

    const timeline = buildTimeline({ activities, tickets, dealEvents, renewalEvents });
    const filteredDeals = filterFields(req.user!, "deal", deals.map(mapDeal));
    const contractDtos = contracts.map((contract) => ({
      id: contract._id.toString(),
      orgId: contract.orgId.toString(),
      companyId: contract.companyId.toString(),
      startAt: contract.startAt.toISOString(),
      endAt: contract.endAt.toISOString(),
      value: contract.value,
      status: contract.status,
      renewalStatus: contract.renewalStatus,
      ownerId: contract.ownerId?.toString(),
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    }));
    const filteredContracts = filterFields(req.user!, "contract", contractDtos);

    res.json({
      company: toCompanyDto(company),
      contacts: contacts.map(mapContact),
      deals: filteredDeals,
      activities: activities.map(mapActivity),
      tickets: tickets.map(mapTicket),
      timeline,
      csProfile: csProfile
        ? {
            id: csProfile._id.toString(),
            orgId: csProfile.orgId.toString(),
            companyId: csProfile.companyId.toString(),
            lifecycleStage: csProfile.lifecycleStage,
            healthScore: csProfile.healthScore,
            healthBreakdown: csProfile.healthBreakdown,
            ownerId: csProfile.ownerId?.toString(),
            onboardingChecklist: csProfile.onboardingChecklist,
            createdAt: csProfile.createdAt.toISOString(),
            updatedAt: csProfile.updatedAt.toISOString(),
          }
        : null,
      contracts: filteredContracts,
    });
  }),
);

export { router as companyRoutes };
