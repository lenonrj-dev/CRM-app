import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requirePermission";
import { ApprovalRequest } from "./approvalRequest.model";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { emitEvent } from "../events/event.service";

const router = Router();

const toApprovalDto = (approval: any) => ({
  id: approval._id.toString(),
  orgId: approval.orgId.toString(),
  entity: approval.entity,
  entityId: approval.entityId,
  requestedBy: approval.requestedBy.toString(),
  approverId: approval.approverId.toString(),
  status: approval.status,
  reason: approval.reason,
  createdAt: approval.createdAt.toISOString(),
  resolvedAt: approval.resolvedAt?.toISOString(),
});

router.get(
  "/approvals",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER"]),
  asyncHandler(async (req, res) => {
    const items = await ApprovalRequest.find({ orgId: req.user!.orgId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: items.map(toApprovalDto) });
  }),
);

const decisionSchema = z.object({ reason: z.string().optional() });

router.post(
  "/approvals/:id/approve",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER"]),
  asyncHandler(async (req, res) => {
    const approval = await ApprovalRequest.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!approval) throw notFound("Aprovação não encontrada");

    approval.status = "APPROVED";
    approval.resolvedAt = new Date();
    await approval.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "approval",
      entityId: approval._id.toString(),
      summary: "Aprovação aprovada",
    });

    if (approval.entity === "PROPOSAL") {
      await emitEvent({
        orgId: req.user!.orgId,
        type: "proposal.approved",
        payload: {
          proposalId: approval.entityId,
          requestedBy: approval.requestedBy.toString(),
          approvedBy: req.user!.id,
          initiatedBy: { userId: req.user!.id, role: req.user!.role },
        },
      });
    }

    res.json({ approval: toApprovalDto(approval) });
  }),
);

router.post(
  "/approvals/:id/reject",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER"]),
  asyncHandler(async (req, res) => {
    const data = decisionSchema.parse(req.body ?? {});
    const approval = await ApprovalRequest.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!approval) throw notFound("Aprovação não encontrada");

    approval.status = "REJECTED";
    approval.reason = data.reason;
    approval.resolvedAt = new Date();
    await approval.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "approval",
      entityId: approval._id.toString(),
      summary: "Aprovação rejeitada",
    });

    res.json({ approval: toApprovalDto(approval) });
  }),
);

export { router as salesApprovalRoutes };
