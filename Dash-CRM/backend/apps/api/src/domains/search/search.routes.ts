import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { Company } from "../crm/company.model";
import { Contact } from "../crm/contact.model";
import { Deal } from "../crm/deal.model";
import { Ticket } from "../support/ticket.model";
import { buildVisibilityQuery } from "../security/authorization.service";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = String(req.query.query ?? req.query.q ?? "").trim();
    if (query.length < 2) {
      return res.json({ groups: [] });
    }

    const visibility = buildVisibilityQuery(req.user!);
    const [companies, contacts, deals, tickets] = await Promise.all([
      Company.find({ orgId: req.user!.orgId, ...visibility, $text: { $search: query } })
        .limit(6)
        .lean(),
      Contact.find({ orgId: req.user!.orgId, ...visibility, $text: { $search: query } })
        .limit(6)
        .lean(),
      Deal.find({ orgId: req.user!.orgId, ...visibility, $text: { $search: query } })
        .limit(6)
        .lean(),
      Ticket.find({
        orgId: req.user!.orgId,
        ...buildVisibilityQuery(req.user!, { ownerField: "assignedTo" }),
        $text: { $search: query },
      })
        .limit(6)
        .lean(),
    ]);

    res.json({
      groups: [
        {
          type: "company",
          items: companies.map((company) => ({
            id: company._id.toString(),
            type: "company",
            title: company.name,
            subtitle: company.industry ?? company.region ?? "",
          })),
        },
        {
          type: "contact",
          items: contacts.map((contact) => ({
            id: contact._id.toString(),
            type: "contact",
            title: `${contact.firstName} ${contact.lastName}`,
            subtitle: contact.email ?? "",
          })),
        },
        {
          type: "deal",
          items: deals.map((deal) => ({
            id: deal._id.toString(),
            type: "deal",
            title: deal.name,
            subtitle: deal.stage,
          })),
        },
        {
          type: "ticket",
          items: tickets.map((ticket) => ({
            id: ticket._id.toString(),
            type: "ticket",
            title: ticket.title,
            subtitle: ticket.status,
          })),
        },
      ],
    });
  }),
);

export { router as searchRoutes };
