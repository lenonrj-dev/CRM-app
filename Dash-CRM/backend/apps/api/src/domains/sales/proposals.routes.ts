import { Router } from "express";
import { z } from "zod";
import { discountTypeValues, proposalStatusValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Proposal } from "./proposal.model";
import { ApprovalRequest } from "./approvalRequest.model";
import { User } from "../auth/user.model";
import { calculateTotals } from "./sales.utils";
import { logAuditEvent } from "../../utils/audit";
import { notFound, badRequest } from "../../utils/apiError";
import { Deal } from "../crm/deal.model";
import { filterFields } from "../security/authorization.service";

const router = Router();

const itemSchema = z.object({
  catalogItemId: z.string().optional(),
  name: z.string().min(1),
  qty: z.number().min(1),
  unitPrice: z.number().min(0),
});

const proposalSchema = z.object({
  companyId: z.string().min(1),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  status: z.enum(proposalStatusValues).optional(),
  items: z.array(itemSchema).min(1),
  discountType: z.enum(discountTypeValues),
  discountValue: z.number().min(0),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const toProposalDto = (proposal: any) => ({
  id: proposal._id.toString(),
  orgId: proposal.orgId.toString(),
  companyId: proposal.companyId.toString(),
  contactId: proposal.contactId?.toString(),
  dealId: proposal.dealId?.toString(),
  status: proposal.status,
  items: proposal.items,
  discountType: proposal.discountType,
  discountValue: proposal.discountValue,
  subtotal: proposal.subtotal,
  total: proposal.total,
  validUntil: proposal.validUntil?.toISOString(),
  notes: proposal.notes,
  createdBy: proposal.createdBy.toString(),
  sentAt: proposal.sentAt?.toISOString(),
  createdAt: proposal.createdAt.toISOString(),
  updatedAt: proposal.updatedAt.toISOString(),
});

const findApprover = async (orgId: string) => {
  const owner = await User.findOne({ orgId, role: "OWNER" }).lean();
  if (owner) return owner._id.toString();
  const admin = await User.findOne({ orgId, role: "ADMIN" }).lean();
  if (admin) return admin._id.toString();
  const manager = await User.findOne({ orgId, role: "MANAGER" }).lean();
  return manager?._id.toString();
};

router.get(
  "/proposals",
  requireAuth,
  requirePermission("sales:read"),
  asyncHandler(async (req, res) => {
    const filters: Record<string, any> = { orgId: req.user!.orgId };
    if (req.query.status) filters.status = String(req.query.status);

    const items = await Proposal.find(filters).sort({ createdAt: -1 }).lean();
    res.json({ items: filterFields(req.user!, "proposal", items.map(toProposalDto)) });
  }),
);

router.post(
  "/proposals",
  requireAuth,
  requirePermission("sales:write"),
  asyncHandler(async (req, res) => {
    const data = proposalSchema.parse(req.body);
    const { subtotal, total, approvalRequired } = calculateTotals({
      items: data.items,
      discountType: data.discountType,
      discountValue: data.discountValue,
    });

    const proposal = await Proposal.create({
      orgId: req.user!.orgId,
      companyId: data.companyId,
      contactId: data.contactId,
      dealId: data.dealId,
      status: data.status ?? "DRAFT",
      items: data.items.map((item) => ({
        catalogItemId: item.catalogItemId,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: item.qty * item.unitPrice,
      })),
      discountType: data.discountType,
      discountValue: data.discountValue,
      subtotal,
      total,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes,
      createdBy: req.user!.id,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "proposal",
      entityId: proposal._id.toString(),
      summary: "Proposta criada",
    });

    if (approvalRequired) {
      const approverId = await findApprover(req.user!.orgId);
      if (approverId) {
        await ApprovalRequest.create({
          orgId: req.user!.orgId,
          entity: "PROPOSAL",
          entityId: proposal._id.toString(),
          requestedBy: req.user!.id,
          approverId,
          status: "PENDING",
        });
      }
    }

    res.status(201).json({ proposal: filterFields(req.user!, "proposal", toProposalDto(proposal)) });
  }),
);

router.get(
  "/proposals/:id",
  requireAuth,
  requirePermission("sales:read"),
  asyncHandler(async (req, res) => {
    const proposal = await Proposal.findOne({ _id: req.params.id, orgId: req.user!.orgId }).lean();
    if (!proposal) throw notFound("Proposta não encontrada");
    res.json({ proposal: filterFields(req.user!, "proposal", toProposalDto(proposal)) });
  }),
);

router.patch(
  "/proposals/:id",
  requireAuth,
  requirePermission("sales:write"),
  asyncHandler(async (req, res) => {
    const data = proposalSchema.partial().parse(req.body);
    const proposal = await Proposal.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!proposal) throw notFound("Proposta não encontrada");

    if (data.items) {
      proposal.items = data.items.map((item) => ({
        catalogItemId: item.catalogItemId,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: item.qty * item.unitPrice,
      }));
    }

    if (data.companyId) proposal.companyId = data.companyId as any;
    if (data.contactId !== undefined) proposal.contactId = data.contactId as any;
    if (data.dealId !== undefined) proposal.dealId = data.dealId as any;
    if (data.notes !== undefined) proposal.notes = data.notes;
    if (data.validUntil) proposal.validUntil = new Date(data.validUntil);

    const discountType = data.discountType ?? proposal.discountType;
    const discountValue = data.discountValue ?? proposal.discountValue;
    const { subtotal, total, approvalRequired } = calculateTotals({
      items: proposal.items,
      discountType,
      discountValue,
    });

    proposal.discountType = discountType;
    proposal.discountValue = discountValue;
    proposal.subtotal = subtotal;
    proposal.total = total;

    if (data.status) {
      if (data.status === "SENT") {
        const approval = await ApprovalRequest.findOne({
          orgId: req.user!.orgId,
          entity: "PROPOSAL",
          entityId: proposal._id.toString(),
          status: "APPROVED",
        }).lean();

        if (approvalRequired && !approval) {
          throw badRequest("Aprovação necessária antes do envio");
        }
        proposal.sentAt = new Date();
      }
      proposal.status = data.status;
    }

    await proposal.save();

    if (proposal.status === "ACCEPTED" && proposal.dealId) {
      await Deal.updateOne({ _id: proposal.dealId, orgId: req.user!.orgId }, { stage: "WON" });
    }

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "proposal",
      entityId: proposal._id.toString(),
      summary: "Status da proposta atualizado",
    });

    res.json({ proposal: filterFields(req.user!, "proposal", toProposalDto(proposal)) });
  }),
);

router.delete(
  "/proposals/:id",
  requireAuth,
  requirePermission("sales:write"),
  asyncHandler(async (req, res) => {
    const proposal = await Proposal.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!proposal) throw notFound("Proposta não encontrada");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "proposal",
      entityId: proposal._id.toString(),
      summary: "Proposta excluída",
    });

    res.json({ ok: true });
  }),
);

router.post(
  "/proposals/:id/request-approval",
  requireAuth,
  requirePermission("sales:write"),
  asyncHandler(async (req, res) => {
    const proposal = await Proposal.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!proposal) throw notFound("Proposta não encontrada");

    const { approvalRequired } = calculateTotals({
      items: proposal.items,
      discountType: proposal.discountType as any,
      discountValue: proposal.discountValue,
    });

    if (!approvalRequired) {
      return res.json({ ok: true, message: "Aprovação não é necessária" });
    }

    const approverId = await findApprover(req.user!.orgId);
    if (!approverId) throw badRequest("Nenhum aprovador disponível");

    const approval = await ApprovalRequest.create({
      orgId: req.user!.orgId,
      entity: "PROPOSAL",
      entityId: proposal._id.toString(),
      requestedBy: req.user!.id,
      approverId,
      status: "PENDING",
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "approval-request",
      entityId: approval._id.toString(),
      summary: "Aprovação solicitada",
    });

    res.json({ approvalId: approval._id.toString() });
  }),
);

export { router as salesProposalRoutes };
