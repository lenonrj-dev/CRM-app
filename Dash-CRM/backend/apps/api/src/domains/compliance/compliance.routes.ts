import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission, requireRole } from "../../middleware/requirePermission";
import { RetentionPolicy } from "./retention.model";
import { Company } from "../crm/company.model";
import { Contact } from "../crm/contact.model";
import { Deal } from "../crm/deal.model";
import { Ticket } from "../support/ticket.model";
import { Activity } from "../crm/activity.model";
import { notFound } from "../../utils/apiError";
import { logAuditEvent } from "../../utils/audit";

const router = Router();

const retentionSchema = z.object({
  auditLogDays: z.number().min(30).max(3650).optional(),
  ticketDays: z.number().min(30).max(3650).optional(),
  marketingDays: z.number().min(30).max(3650).optional(),
});

const getPolicy = async (orgId: string) => {
  const existing = await RetentionPolicy.findOne({ orgId });
  if (existing) return existing;
  return RetentionPolicy.create({ orgId });
};

router.get(
  "/retention",
  requireAuth,
  requirePermission("compliance:read"),
  asyncHandler(async (req, res) => {
    const policy = await getPolicy(req.user!.orgId);
    res.json({
      policy: {
        orgId: policy.orgId.toString(),
        auditLogDays: policy.auditLogDays,
        ticketDays: policy.ticketDays,
        marketingDays: policy.marketingDays,
        updatedAt: policy.updatedAt.toISOString(),
      },
    });
  }),
);

router.put(
  "/retention",
  requireAuth,
  requirePermission("compliance:write"),
  asyncHandler(async (req, res) => {
    const updates = retentionSchema.parse(req.body);
    const policy = await getPolicy(req.user!.orgId);
    if (updates.auditLogDays !== undefined) policy.auditLogDays = updates.auditLogDays;
    if (updates.ticketDays !== undefined) policy.ticketDays = updates.ticketDays;
    if (updates.marketingDays !== undefined) policy.marketingDays = updates.marketingDays;
    await policy.save();

    res.json({
      policy: {
        orgId: policy.orgId.toString(),
        auditLogDays: policy.auditLogDays,
        ticketDays: policy.ticketDays,
        marketingDays: policy.marketingDays,
        updatedAt: policy.updatedAt.toISOString(),
      },
    });
  }),
);

router.get(
  "/export/:entity/:id",
  requireAuth,
  requirePermission("compliance:read"),
  asyncHandler(async (req, res) => {
      const { entity, id } = req.params;
    if (entity === "company") {
      const company = await Company.findOne({ _id: id, orgId: req.user!.orgId }).lean();
      if (!company) throw notFound("Empresa não encontrada");
      const [contacts, deals, tickets, activities] = await Promise.all([
        Contact.find({ orgId: req.user!.orgId, companyId: company._id }).lean(),
        Deal.find({ orgId: req.user!.orgId, companyId: company._id }).lean(),
        Ticket.find({ orgId: req.user!.orgId, companyId: company._id }).lean(),
        Activity.find({ orgId: req.user!.orgId, companyId: company._id }).lean(),
      ]);
      return res.json({
        entity,
        id,
        payload: { company, contacts, deals, tickets, activities },
      });
    }
    if (entity === "contact") {
      const contact = await Contact.findOne({ _id: id, orgId: req.user!.orgId }).lean();
      if (!contact) throw notFound("Contato não encontrado");
      const [company, deals, tickets, activities] = await Promise.all([
        contact.companyId ? Company.findById(contact.companyId).lean() : null,
        Deal.find({ orgId: req.user!.orgId, contactId: contact._id }).lean(),
        Ticket.find({ orgId: req.user!.orgId, contactId: contact._id }).lean(),
        Activity.find({ orgId: req.user!.orgId, contactId: contact._id }).lean(),
      ]);
      return res.json({
        entity,
        id,
        payload: { contact, company, deals, tickets, activities },
      });
    }
    throw notFound("Entidade não suportada");
  }),
);

router.post(
  "/anonymize/:entity/:id",
  requireAuth,
  requireRole(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const { entity, id } = req.params;
    if (entity === "company") {
      const company = await Company.findOne({ _id: id, orgId: req.user!.orgId });
      if (!company) throw notFound("Empresa não encontrada");
      company.name = "Empresa anonimizada";
      company.website = undefined;
      company.industry = undefined;
      company.tags = [];
      await company.save();

      await logAuditEvent({
        req,
        action: "UPDATE",
        entity: "compliance",
        entityId: company._id.toString(),
        summary: "Empresa anonimizada",
      });
      return res.json({ ok: true });
    }
    if (entity === "contact") {
      const contact = await Contact.findOne({ _id: id, orgId: req.user!.orgId });
      if (!contact) throw notFound("Contato não encontrado");
      contact.firstName = "Contato";
      contact.lastName = "Anonimizado";
      contact.email = undefined;
      contact.phone = undefined;
      await contact.save();

      await logAuditEvent({
        req,
        action: "UPDATE",
        entity: "compliance",
        entityId: contact._id.toString(),
        summary: "Contato anonimizado",
      });
      return res.json({ ok: true });
    }
    throw notFound("Entidade não suportada");
  }),
);

export { router as complianceRoutes };
