import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission, requireRole } from "../../middleware/requirePermission";
import { Workflow } from "./workflow.model";
import { WorkflowRun } from "./workflowRun.model";
import { runWorkflowOnce } from "./automation.service";
import { Company } from "../crm/company.model";
import { Contact } from "../crm/contact.model";
import { Deal } from "../crm/deal.model";
import { Ticket } from "../support/ticket.model";
import { notFound } from "../../utils/apiError";

const router = Router();

const toRunDto = (run: any) => ({
  id: run._id.toString(),
  orgId: run.orgId.toString(),
  workflowId: run.workflowId.toString(),
  status: run.status,
  triggerEvent: run.triggerEvent,
  result: run.result,
  error: run.error,
  executedAt: run.executedAt.toISOString(),
});

router.get(
  "/runs",
  requireAuth,
  requirePermission("automation:read"),
  asyncHandler(async (req, res) => {
    const items = await WorkflowRun.find({ orgId: req.user!.orgId })
      .sort({ executedAt: -1 })
      .limit(200)
      .lean();
    res.json({ items: items.map(toRunDto) });
  }),
);

const testSchema = z.object({
  payload: z.record(z.any()).optional(),
});

router.post(
  "/test-run/:workflowId",
  requireAuth,
  requireRole(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const data = testSchema.parse(req.body ?? {});
    const workflow = await Workflow.findOne({ _id: req.params.workflowId, orgId: req.user!.orgId }).lean();
    if (!workflow) throw notFound("Fluxo não encontrado");

    const [company, contact, deal, ticket] = await Promise.all([
      Company.findOne({ orgId: req.user!.orgId }).lean(),
      Contact.findOne({ orgId: req.user!.orgId }).lean(),
      Deal.findOne({ orgId: req.user!.orgId }).lean(),
      Ticket.findOne({ orgId: req.user!.orgId }).lean(),
    ]);

    const payload = {
      companyId: company?._id.toString(),
      contactId: contact?._id.toString(),
      dealId: deal?._id.toString(),
      ticketId: ticket?._id.toString(),
      ownerId: req.user!.id,
      ...data.payload,
    };

    await runWorkflowOnce({
      orgId: req.user!.orgId,
      workflowId: workflow._id.toString(),
      triggerType: workflow.trigger?.type ?? "LEAD_CREATED",
      payload,
      initiatedBy: { userId: req.user!.id, role: req.user!.role },
    });

    res.json({ ok: true });
  }),
);

export { router as automationRunRoutes };
