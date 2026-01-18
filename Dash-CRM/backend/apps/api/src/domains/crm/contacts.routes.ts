import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Contact } from "./contact.model";
import { Company } from "./company.model";
import { Deal } from "./deal.model";
import { Ticket } from "../support/ticket.model";
import { buildDiff } from "../../utils/diff";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { calculateContactScore } from "../marketing/scoring.service";
import { emitEvent } from "../events/event.service";
import { visibilityScopeValues } from "@ateliux/shared";
import { buildVisibilityQuery } from "../security/authorization.service";

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

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  companyId: z.string().optional(),
  ownerId: z.string().optional(),
  unitId: z.string().optional(),
  teamId: z.string().optional(),
  visibilityScope: z.enum(visibilityScopeValues).optional(),
  createdFrom: z.string().optional(),
  attribution: attributionSchema,
});

const toContactDto = (contact: any) => ({
  id: contact._id.toString(),
  orgId: contact.orgId.toString(),
  firstName: contact.firstName,
  lastName: contact.lastName,
  email: contact.email,
  phone: contact.phone,
  title: contact.title,
  companyId: contact.companyId?.toString(),
  ownerId: contact.ownerId?.toString(),
  unitId: contact.unitId?.toString(),
  teamId: contact.teamId?.toString(),
  visibilityScope: contact.visibilityScope,
  createdFrom: contact.createdFrom,
  attribution: contact.attribution,
  leadScore: contact.leadScore,
  createdAt: contact.createdAt.toISOString(),
  updatedAt: contact.updatedAt.toISOString(),
});

const updateContactScore = async (contact: any, orgId: string) => {
  const company = contact.companyId
    ? await Company.findOne({ _id: contact.companyId, orgId }).lean()
    : null;
  const highTickets = await Ticket.countDocuments({
    orgId,
    companyId: contact.companyId,
    status: { $in: ["OPEN", "PENDING"] },
    priority: { $in: ["HIGH", "URGENT"] },
  });
  const hasRecentDeal = await Deal.exists({ orgId, contactId: contact._id });

  contact.leadScore = calculateContactScore({
    contact: toContactDto(contact),
    company: company
      ? {
          id: company._id.toString(),
          orgId: company.orgId.toString(),
          name: company.name,
          industry: company.industry,
          website: company.website,
          size: company.size,
          region: company.region,
          ownerId: company.ownerId?.toString(),
          tags: company.tags ?? [],
          createdAt: company.createdAt.toISOString(),
          updatedAt: company.updatedAt.toISOString(),
        }
      : null,
    hasOpenHighTickets: highTickets > 0,
    hasRecentDeal: Boolean(hasRecentDeal),
  }) as any;
};

const resolveDefaults = async (req: any, data: z.infer<typeof contactSchema>) => {
  const company = data.companyId
    ? await Company.findOne({ _id: data.companyId, orgId: req.user!.orgId }).lean()
    : null;
  const unitId = data.unitId ?? company?.unitId?.toString() ?? req.user!.unitId;
  const teamId = data.teamId ?? company?.teamId?.toString() ?? req.user!.teamIds?.[0];
  const visibilityScope =
    data.visibilityScope ?? company?.visibilityScope ?? (teamId ? "TEAM" : unitId ? "UNIT" : "ORG");
  const ownerId = data.ownerId ?? company?.ownerId?.toString();
  return { unitId, teamId, visibilityScope, ownerId };
};

router.get(
  "/",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const items = await Contact.find({
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: items.map(toContactDto) });
  }),
);

router.post(
  "/",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = contactSchema.parse(req.body);
    const defaults = await resolveDefaults(req, data);
    const contact = await Contact.create({ ...data, ...defaults, orgId: req.user!.orgId });
    await updateContactScore(contact, req.user!.orgId);
    await contact.save();

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "contact",
      entityId: contact._id.toString(),
      summary: `Contato ${contact.firstName} ${contact.lastName} criado`,
    });

    await emitEvent({
      orgId: req.user!.orgId,
      type: "lead.created",
      payload: {
        companyId: contact.companyId?.toString(),
        contactId: contact._id.toString(),
        ownerId: contact.ownerId?.toString(),
        initiatedBy: { userId: req.user!.id, role: req.user!.role },
      },
    });

    res.status(201).json({ contact: toContactDto(contact) });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("crm:read"),
  asyncHandler(async (req, res) => {
    const contact = await Contact.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    }).lean();
    if (!contact) throw notFound("Contato não encontrado");
    res.json({ contact: toContactDto(contact) });
  }),
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const data = contactSchema.partial().parse(req.body);
    const contact = await Contact.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!contact) throw notFound("Contato não encontrado");

    const before = contact.toObject();
    Object.assign(contact, data);
    await updateContactScore(contact, req.user!.orgId);
    await contact.save();

    const changes = buildDiff(before, contact.toObject(), [
      "firstName",
      "lastName",
      "email",
      "phone",
      "title",
      "companyId",
      "ownerId",
      "unitId",
      "teamId",
      "visibilityScope",
      "createdFrom",
    ]);

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "contact",
      entityId: contact._id.toString(),
      summary: `Contato ${contact.firstName} ${contact.lastName} atualizado`,
      changes,
    });

    res.json({ contact: toContactDto(contact) });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("crm:write"),
  asyncHandler(async (req, res) => {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user!.orgId,
      ...buildVisibilityQuery(req.user!),
    });
    if (!contact) throw notFound("Contato não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "contact",
      entityId: contact._id.toString(),
      summary: `Contato ${contact.firstName} ${contact.lastName} excluído`,
    });

    res.json({ ok: true });
  }),
);

export { router as contactRoutes };
