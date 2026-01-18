import { Router } from "express";
import { z } from "zod";
import { contractStatusValues, renewalStatusValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission, requireRole } from "../../middleware/requirePermission";
import { Contract } from "./contract.model";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { filterFields } from "../security/authorization.service";

const router = Router();

const contractSchema = z.object({
  companyId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  value: z.number().min(0),
  status: z.enum(contractStatusValues),
  renewalStatus: z.enum(renewalStatusValues),
  ownerId: z.string().optional(),
});

const toContractDto = (contract: any) => ({
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
});

router.get(
  "/contracts",
  requireAuth,
  requirePermission("cs:read"),
  asyncHandler(async (req, res) => {
    const items = await Contract.find({ orgId: req.user!.orgId }).sort({ endAt: 1 }).lean();
    res.json({ items: filterFields(req.user!, "contract", items.map(toContractDto)) });
  }),
);

router.post(
  "/contracts",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER", "USER"]),
  asyncHandler(async (req, res) => {
    const data = contractSchema.parse(req.body);
    const contract = await Contract.create({
      orgId: req.user!.orgId,
      companyId: data.companyId,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      value: data.value,
      status: data.status,
      renewalStatus: data.renewalStatus,
      ownerId: data.ownerId,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "contract",
      entityId: contract._id.toString(),
      summary: "Contrato criado",
    });

    res.status(201).json({ contract: filterFields(req.user!, "contract", toContractDto(contract)) });
  }),
);

router.get(
  "/contracts/:id",
  requireAuth,
  requirePermission("cs:read"),
  asyncHandler(async (req, res) => {
    const contract = await Contract.findOne({ _id: req.params.id, orgId: req.user!.orgId }).lean();
    if (!contract) throw notFound("Contrato não encontrado");
    res.json({ contract: filterFields(req.user!, "contract", toContractDto(contract)) });
  }),
);

router.patch(
  "/contracts/:id",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER"]),
  asyncHandler(async (req, res) => {
    const data = contractSchema.partial().parse(req.body);
    const contract = await Contract.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!contract) throw notFound("Contrato não encontrado");

    Object.assign(contract, {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : contract.startAt,
      endAt: data.endAt ? new Date(data.endAt) : contract.endAt,
    });
    await contract.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "contract",
      entityId: contract._id.toString(),
      summary: "Contrato atualizado",
    });

    res.json({ contract: filterFields(req.user!, "contract", toContractDto(contract)) });
  }),
);

router.delete(
  "/contracts/:id",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER"]),
  asyncHandler(async (req, res) => {
    const contract = await Contract.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!contract) throw notFound("Contrato não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "contract",
      entityId: contract._id.toString(),
      summary: "Contrato excluído",
    });

    res.json({ ok: true });
  }),
);

router.get(
  "/renewals",
  requireAuth,
  requirePermission("cs:read"),
  asyncHandler(async (req, res) => {
    const days = Number(req.query.days ?? 90);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + (Number.isNaN(days) ? 90 : days));

    const items = await Contract.find({
      orgId: req.user!.orgId,
      endAt: { $gte: start, $lte: end },
    })
      .sort({ endAt: 1 })
      .lean();

    res.json({ items: filterFields(req.user!, "contract", items.map(toContractDto)) });
  }),
);

export { router as csContractRoutes };
