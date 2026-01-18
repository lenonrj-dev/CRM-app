import { Router } from "express";
import { z } from "zod";
import { catalogCurrencyValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { CatalogItem } from "./catalogItem.model";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";

const router = Router();

const catalogSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  unitPrice: z.number().min(0),
  currency: z.enum(catalogCurrencyValues),
  active: z.boolean().optional(),
});

const toCatalogDto = (item: any) => ({
  id: item._id.toString(),
  orgId: item.orgId.toString(),
  name: item.name,
  description: item.description,
  unitPrice: item.unitPrice,
  currency: item.currency,
  active: item.active,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

router.get(
  "/catalog",
  requireAuth,
  requirePermission("sales:read"),
  asyncHandler(async (req, res) => {
    const items = await CatalogItem.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({ items: items.map(toCatalogDto) });
  }),
);

router.post(
  "/catalog",
  requireAuth,
  requirePermission("sales:write"),
  asyncHandler(async (req, res) => {
    const data = catalogSchema.parse(req.body);
    const item = await CatalogItem.create({
      orgId: req.user!.orgId,
      name: data.name,
      description: data.description,
      unitPrice: data.unitPrice,
      currency: data.currency,
      active: data.active ?? true,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "catalog-item",
      entityId: item._id.toString(),
      summary: `Item de catálogo ${item.name} criado`,
    });

    res.status(201).json({ item: toCatalogDto(item) });
  }),
);

router.patch(
  "/catalog/:id",
  requireAuth,
  requirePermission("sales:write"),
  asyncHandler(async (req, res) => {
    const data = catalogSchema.partial().parse(req.body);
    const item = await CatalogItem.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!item) throw notFound("Item de catálogo não encontrado");

    Object.assign(item, data);
    await item.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "catalog-item",
      entityId: item._id.toString(),
      summary: `Item de catálogo ${item.name} atualizado`,
    });

    res.json({ item: toCatalogDto(item) });
  }),
);

router.delete(
  "/catalog/:id",
  requireAuth,
  requirePermission("sales:write"),
  asyncHandler(async (req, res) => {
    const item = await CatalogItem.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!item) throw notFound("Item de catálogo não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "catalog-item",
      entityId: item._id.toString(),
      summary: `Item de catálogo ${item.name} excluído`,
    });

    res.json({ ok: true });
  }),
);

export { router as salesCatalogRoutes };
