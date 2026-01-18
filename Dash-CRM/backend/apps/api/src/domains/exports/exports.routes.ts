import { Router } from "express";
import { z } from "zod";
import { stringify } from "csv-stringify/sync";
import * as XLSX from "xlsx";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { exportFormatValues, exportTypeValues } from "@ateliux/shared";
import { Company } from "../crm/company.model";
import { Contact } from "../crm/contact.model";
import { Deal } from "../crm/deal.model";
import { Activity } from "../crm/activity.model";
import { Ticket } from "../support/ticket.model";
import { Campaign } from "../marketing/campaign.model";
import { CustomerSuccessProfile } from "../cs/csProfile.model";
import { Contract } from "../cs/contract.model";
import { AuditLog } from "../settings/auditLog.model";
import { buildVisibilityQuery, can, filterFields } from "../security/authorization.service";

const router = Router();

const exportSchema = z.object({
  type: z.enum(exportTypeValues),
  format: z.enum(exportFormatValues),
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const sendFile = (res: any, name: string, format: string, rows: Record<string, unknown>[]) => {
  if (format === "CSV") {
    const csv = stringify(rows, { header: true });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${name}.csv"`);
    return res.send(csv);
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${name}.xlsx"`);
  return res.send(buffer);
};

router.post(
  "/",
  requireAuth,
  requirePermission("exports:read"),
  asyncHandler(async (req, res) => {
    const data = exportSchema.parse(req.body);

    if (data.type === "audit:logs" && !can(req.user!, "audit:read")) {
      return res.status(403).json({ message: "Acesso negado", code: "FORBIDDEN" });
    }

    const visibility = buildVisibilityQuery(req.user!);
    let rows: Record<string, unknown>[] = [];

    switch (data.type) {
      case "crm:companies": {
        const items = await Company.find({ orgId: req.user!.orgId, ...visibility }).lean();
        rows = items.map((company) => ({
          name: company.name,
          industry: company.industry,
          size: company.size,
          region: company.region,
          ownerId: company.ownerId?.toString(),
          unitId: company.unitId?.toString(),
          teamId: company.teamId?.toString(),
          visibilityScope: company.visibilityScope,
          createdAt: company.createdAt.toISOString(),
        }));
        break;
      }
      case "crm:contacts": {
        const items = await Contact.find({ orgId: req.user!.orgId, ...visibility }).lean();
        rows = items.map((contact) => ({
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
          createdAt: contact.createdAt.toISOString(),
        }));
        break;
      }
      case "crm:deals": {
        const items = await Deal.find({ orgId: req.user!.orgId, ...visibility }).lean();
        const mapped = items.map((deal) => ({
          name: deal.name,
          stage: deal.stage,
          value: deal.value,
          expectedCloseDate: deal.expectedCloseDate?.toISOString(),
          ownerId: deal.ownerId?.toString(),
          companyId: deal.companyId?.toString(),
          contactId: deal.contactId?.toString(),
          visibilityScope: deal.visibilityScope,
          createdAt: deal.createdAt.toISOString(),
        }));
        rows = filterFields(req.user!, "deal", mapped);
        break;
      }
      case "crm:activities": {
        const items = await Activity.find({ orgId: req.user!.orgId, ...visibility }).lean();
        rows = items.map((activity) => ({
          type: activity.type,
          subject: activity.subject,
          dueDate: activity.dueDate?.toISOString(),
          completed: activity.completed,
          ownerId: activity.ownerId?.toString(),
          companyId: activity.companyId?.toString(),
          dealId: activity.dealId?.toString(),
          createdAt: activity.createdAt.toISOString(),
        }));
        break;
      }
      case "support:tickets": {
        const items = await Ticket.find({
          orgId: req.user!.orgId,
          ...buildVisibilityQuery(req.user!, { ownerField: "assignedTo" }),
        }).lean();
        rows = items.map((ticket) => ({
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          companyId: ticket.companyId?.toString(),
          contactId: ticket.contactId?.toString(),
          assignedTo: ticket.assignedTo?.toString(),
          visibilityScope: ticket.visibilityScope,
          createdAt: ticket.createdAt.toISOString(),
        }));
        break;
      }
      case "marketing:campaigns": {
        const items = await Campaign.find({ orgId: req.user!.orgId }).lean();
        rows = items.map((campaign) => ({
          name: campaign.name,
          channel: campaign.channel,
          status: campaign.status,
          budget: campaign.budget,
          startAt: campaign.startAt?.toISOString(),
          endAt: campaign.endAt?.toISOString(),
        }));
        break;
      }
      case "marketing:attribution": {
        const [contacts, deals] = await Promise.all([
          Contact.find({ orgId: req.user!.orgId, ...visibility }).lean(),
          Deal.find({ orgId: req.user!.orgId, ...visibility }).lean(),
        ]);
        const map = new Map<string, { source?: string; medium?: string; campaign?: string; leads: number; deals: number; revenue: number }>();

        const addRow = (utm: any, type: "lead" | "deal", value = 0) => {
          const key = `${utm?.source ?? "direct"}|${utm?.medium ?? "-"}|${utm?.campaign ?? "-"}`;
          const existing = map.get(key) ?? {
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
          map.set(key, existing);
        };

        contacts.forEach((contact) => addRow(contact.attribution?.lastTouch?.utm, "lead"));
        deals.forEach((deal) => addRow(deal.attribution?.lastTouch?.utm, "deal", deal.value ?? 0));
        rows = Array.from(map.values());
        break;
      }
      case "cs:accounts": {
        const items = await CustomerSuccessProfile.find({ orgId: req.user!.orgId }).lean();
        rows = items.map((profile) => ({
          companyId: profile.companyId.toString(),
          lifecycleStage: profile.lifecycleStage,
          healthScore: profile.healthScore,
          ownerId: profile.ownerId?.toString(),
          createdAt: profile.createdAt.toISOString(),
        }));
        break;
      }
      case "cs:renewals": {
        const items = await Contract.find({ orgId: req.user!.orgId }).lean();
        rows = items.map((contract) => ({
          companyId: contract.companyId.toString(),
          startAt: contract.startAt.toISOString(),
          endAt: contract.endAt.toISOString(),
          value: contract.value,
          status: contract.status,
          renewalStatus: contract.renewalStatus,
          ownerId: contract.ownerId?.toString(),
        }));
        rows = filterFields(req.user!, "contract", rows);
        break;
      }
      case "audit:logs": {
        const items = await AuditLog.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
        rows = items.map((log) => ({
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          summary: log.summary,
          userId: log.userId.toString(),
          role: log.role,
          ip: log.ip,
          createdAt: log.createdAt.toISOString(),
        }));
        break;
      }
      default:
        rows = [];
    }

    return sendFile(res, data.type.replace(":", "-"), data.format, rows);
  }),
);

export { router as exportRoutes };
