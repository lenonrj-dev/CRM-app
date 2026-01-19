import { Router } from "express";
import { z } from "zod";
import { workflowActionValues, workflowTriggerValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission, requireRole } from "../../middleware/requirePermission";
import { Workflow } from "./workflow.model";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { workflowTemplates } from "./workflow.templates";

const router = Router();

const conditionSchema = z.object({
  field: z.string().min(1),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const actionSchema = z.object({
  type: z.enum(workflowActionValues),
  payload: z.record(z.string(), z.any()).default({}),
});

const triggerSchema = z.object({
  type: z.enum(workflowTriggerValues),
  params: z.record(z.string(), z.any()).optional(),
});

const workflowSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  trigger: triggerSchema,
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).optional(),
});

const toWorkflowDto = (workflow: any) => ({
  id: workflow._id.toString(),
  orgId: workflow.orgId.toString(),
  name: workflow.name,
  description: workflow.description,
  enabled: workflow.enabled,
  trigger: workflow.trigger,
  conditions: workflow.conditions ?? [],
  actions: workflow.actions ?? [],
  createdBy: workflow.createdBy.toString(),
  updatedAt: workflow.updatedAt?.toISOString(),
  createdAt: workflow.createdAt.toISOString(),
});

router.get(
  "/workflows",
  requireAuth,
  requirePermission("automation:read"),
  asyncHandler(async (req, res) => {
    const items = await Workflow.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({ items: items.map(toWorkflowDto) });
  }),
);

router.post(
  "/workflows",
  requireAuth,
  requirePermission("automation:write"),
  asyncHandler(async (req, res) => {
    const data = workflowSchema.parse(req.body);
    const workflow = await Workflow.create({
      orgId: req.user!.orgId,
      name: data.name,
      description: data.description,
      enabled: data.enabled ?? false,
      trigger: data.trigger,
      conditions: data.conditions ?? [],
      actions: data.actions ?? [],
      createdBy: req.user!.id,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "workflow",
      entityId: workflow._id.toString(),
      summary: `Fluxo ${workflow.name} criado`,
    });

    res.status(201).json({ workflow: toWorkflowDto(workflow) });
  }),
);

router.get(
  "/workflows/:id",
  requireAuth,
  requirePermission("automation:read"),
  asyncHandler(async (req, res) => {
    const workflow = await Workflow.findOne({ _id: req.params.id, orgId: req.user!.orgId }).lean();
    if (!workflow) throw notFound("Fluxo não encontrado");
    res.json({ workflow: toWorkflowDto(workflow) });
  }),
);

router.patch(
  "/workflows/:id",
  requireAuth,
  requirePermission("automation:write"),
  asyncHandler(async (req, res) => {
    const data = workflowSchema.partial().parse(req.body);
    const workflow = await Workflow.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!workflow) throw notFound("Fluxo não encontrado");

    Object.assign(workflow, data);
    await workflow.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "workflow",
      entityId: workflow._id.toString(),
      summary: `Fluxo ${workflow.name} atualizado`,
    });

    res.json({ workflow: toWorkflowDto(workflow) });
  }),
);

router.delete(
  "/workflows/:id",
  requireAuth,
  requirePermission("automation:write"),
  asyncHandler(async (req, res) => {
    const workflow = await Workflow.findOneAndDelete({ _id: req.params.id, orgId: req.user!.orgId });
    if (!workflow) throw notFound("Fluxo não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "workflow",
      entityId: workflow._id.toString(),
      summary: `Fluxo ${workflow.name} excluído`,
    });

    res.json({ ok: true });
  }),
);

router.post(
  "/workflows/:id/toggle",
  requireAuth,
  requirePermission("automation:write"),
  asyncHandler(async (req, res) => {
    const workflow = await Workflow.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!workflow) throw notFound("Fluxo não encontrado");

    workflow.enabled = !workflow.enabled;
    await workflow.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "workflow",
      entityId: workflow._id.toString(),
      summary: `Fluxo ${workflow.name} ${workflow.enabled ? "ativado" : "desativado"}`,
    });

    res.json({ workflow: toWorkflowDto(workflow) });
  }),
);

router.get(
  "/workflows/library",
  requireAuth,
  requirePermission("automation:read"),
  asyncHandler(async (_req, res) => {
    res.json({ items: workflowTemplates });
  }),
);

router.post(
  "/workflows/library/:templateId/install",
  requireAuth,
  requirePermission("automation:write"),
  asyncHandler(async (req, res) => {
    const template = workflowTemplates.find((item) => item.id === req.params.templateId);
    if (!template) throw notFound("Modelo não encontrado");

    const workflow = await Workflow.create({
      orgId: req.user!.orgId,
      name: template.name,
      description: template.description,
      enabled: true,
      trigger: template.trigger,
      conditions: template.conditions,
      actions: template.actions,
      createdBy: req.user!.id,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "workflow",
      entityId: workflow._id.toString(),
      summary: `Fluxo ${workflow.name} instalado a partir do modelo`,
    });

    res.status(201).json({ workflow: toWorkflowDto(workflow) });
  }),
);

export { router as automationWorkflowRoutes };
