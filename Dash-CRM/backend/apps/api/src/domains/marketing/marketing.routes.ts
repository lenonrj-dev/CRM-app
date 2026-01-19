import { Router } from "express";
import { z } from "zod";
import { createdFromValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Contact } from "../crm/contact.model";
import { Deal } from "../crm/deal.model";
import { Company } from "../crm/company.model";
import { Ticket } from "../support/ticket.model";
import { applyTouch, calculateContactScore, calculateDealScore } from "./scoring.service";
import { logAuditEvent } from "../../utils/audit";
import { badRequest } from "../../utils/apiError";
import { buildVisibilityQuery } from "../security/authorization.service";

const router = Router();

router.get(
  "/attribution",
  requireAuth,
  requirePermission("marketing:read"),
  asyncHandler(async (req, res) => {
    const visibility = buildVisibilityQuery(req.user!);
    const [contacts, deals] = await Promise.all([
      Contact.find({ orgId: req.user!.orgId, ...visibility }).lean(),
      Deal.find({ orgId: req.user!.orgId, ...visibility }).lean(),
    ]);

    const rows = new Map<string, { source?: string; medium?: string; campaign?: string; leads: number; deals: number; revenue: number }>();

    const addRow = (utm: any, type: "lead" | "deal", value = 0) => {
      const key = `${utm?.source ?? "direct"}|${utm?.medium ?? "-"}|${utm?.campaign ?? "-"}`;
      const existing = rows.get(key) ?? {
        source: utm?.source ?? "direct",
        medium: utm?.medium,
        campaign: utm?.campaign,
        leads: 0,
        deals: 0,
        revenue: 0,
      };
      if (type === "lead") existing.leads += 1;
      if (type === "deal") {
        existing.deals += 1;
        existing.revenue += value;
      }
      rows.set(key, existing);
    };

    contacts.forEach((contact) => addRow(contact.attribution?.lastTouch?.utm, "lead"));
    deals.forEach((deal) => addRow(deal.attribution?.lastTouch?.utm, "deal", deal.value ?? 0));

    res.json({ items: Array.from(rows.values()) });
  }),
);

const trackSchema = z.object({
  entityType: z.enum(["contact", "deal"]),
  entityId: z.string().min(1),
  touch: z
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
      createdFrom: z.enum(createdFromValues).optional(),
      timestamp: z.string().datetime().optional(),
    })
    .optional(),
});

router.post(
  "/utm/track",
  requireAuth,
  requirePermission("marketing:write"),
  asyncHandler(async (req, res) => {
    const data = trackSchema.parse(req.body);

    if (data.entityType === "contact") {
      const contact = await Contact.findOne({ _id: data.entityId, orgId: req.user!.orgId });
      if (!contact) throw badRequest("Contato nao encontrado");

      contact.attribution = applyTouch(contact.attribution, data.touch ?? {});
      if (!contact.createdFrom && data.touch?.createdFrom) {
        contact.createdFrom = data.touch.createdFrom;
      }

      const company = contact.companyId
        ? await Company.findOne({ _id: contact.companyId, orgId: req.user!.orgId }).lean()
        : null;
      const highTickets = await Ticket.countDocuments({
        orgId: req.user!.orgId,
        companyId: contact.companyId,
        status: { $in: ["OPEN", "PENDING"] },
        priority: { $in: ["HIGH", "URGENT"] },
      });
      const hasRecentDeal = await Deal.exists({ orgId: req.user!.orgId, contactId: contact._id });
      contact.leadScore = calculateContactScore({
        contact: {
          id: contact._id.toString(),
          orgId: contact.orgId.toString(),
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          title: contact.title,
          companyId: contact.companyId?.toString(),
          ownerId: contact.ownerId?.toString(),
          createdFrom: contact.createdFrom as any,
          attribution: contact.attribution as any,
          leadScore: contact.leadScore as any,
          createdAt: contact.createdAt.toISOString(),
          updatedAt: contact.updatedAt.toISOString(),
        },
        company: company
          ? {
              id: company._id.toString(),
              orgId: company.orgId.toString(),
              name: company.name,
              industry: company.industry,
              website: company.website,
              size: company.size,
              ownerId: company.ownerId?.toString(),
              tags: company.tags ?? [],
              createdAt: company.createdAt.toISOString(),
              updatedAt: company.updatedAt.toISOString(),
            }
          : null,
        hasOpenHighTickets: highTickets > 0,
        hasRecentDeal: Boolean(hasRecentDeal),
      }) as any;

      await contact.save();

      await logAuditEvent({
        req,
        action: "UPDATE",
        entity: "utm",
        entityId: contact._id.toString(),
        summary: "Toque UTM registrado para contato",
      });

      return res.json({ ok: true });
    }

    const deal = await Deal.findOne({ _id: data.entityId, orgId: req.user!.orgId });
    if (!deal) throw badRequest("Oportunidade nao encontrada");

    deal.attribution = applyTouch(deal.attribution, data.touch ?? {});
    if (!deal.createdFrom && data.touch?.createdFrom) {
      deal.createdFrom = data.touch.createdFrom;
    }

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
      createdFrom: deal.createdFrom as any,
      attribution: deal.attribution as any,
      leadScore: deal.leadScore as any,
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    }) as any;

    await deal.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "utm",
      entityId: deal._id.toString(),
      summary: "Toque UTM registrado para oportunidade",
    });

    return res.json({ ok: true });
  }),
);

export { router as marketingRoutes };
