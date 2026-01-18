import { Router } from "express";
import { z } from "zod";
import { randomBytes } from "crypto";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { WebhookSubscription } from "./webhook.model";
import { webhookEventValues } from "@ateliux/shared";
import { notFound } from "../../utils/apiError";
import { logAuditEvent } from "../../utils/audit";

const router = Router();

const webhookSchema = z.object({
  eventType: z.enum(webhookEventValues),
  url: z.string().url(),
  enabled: z.boolean().optional(),
});

const maskSecret = (secret: string) => (secret.length > 6 ? `${secret.slice(0, 4)}...${secret.slice(-2)}` : secret);

router.get(
  "/webhooks",
  requireAuth,
  requirePermission("integrations:read"),
  asyncHandler(async (req, res) => {
    const items = await WebhookSubscription.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({
      items: items.map((hook) => ({
        id: hook._id.toString(),
        orgId: hook.orgId.toString(),
        eventType: hook.eventType,
        url: hook.url,
        enabled: hook.enabled,
        secretHint: maskSecret(hook.secret),
        createdAt: hook.createdAt.toISOString(),
        updatedAt: hook.updatedAt.toISOString(),
      })),
    });
  }),
);

router.post(
  "/webhooks",
  requireAuth,
  requirePermission("integrations:write"),
  asyncHandler(async (req, res) => {
    const data = webhookSchema.parse(req.body);
    const secret = randomBytes(16).toString("hex");
    const hook = await WebhookSubscription.create({
      orgId: req.user!.orgId,
      eventType: data.eventType,
      url: data.url,
      enabled: data.enabled ?? true,
      secret,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "webhook",
      entityId: hook._id.toString(),
      summary: `Webhook ${hook.eventType} criado`,
    });

    res.status(201).json({
      webhook: {
        id: hook._id.toString(),
        orgId: hook.orgId.toString(),
        eventType: hook.eventType,
        url: hook.url,
        enabled: hook.enabled,
        secret,
        createdAt: hook.createdAt.toISOString(),
        updatedAt: hook.updatedAt.toISOString(),
      },
    });
  }),
);

router.patch(
  "/webhooks/:id",
  requireAuth,
  requirePermission("integrations:write"),
  asyncHandler(async (req, res) => {
    const updates = webhookSchema.partial().parse(req.body);
    const hook = await WebhookSubscription.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!hook) throw notFound("Webhook não encontrado");

    Object.assign(hook, updates);
    await hook.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "webhook",
      entityId: hook._id.toString(),
      summary: `Webhook ${hook.eventType} atualizado`,
    });

    res.json({
      webhook: {
        id: hook._id.toString(),
        orgId: hook.orgId.toString(),
        eventType: hook.eventType,
        url: hook.url,
        enabled: hook.enabled,
        secretHint: maskSecret(hook.secret),
        createdAt: hook.createdAt.toISOString(),
        updatedAt: hook.updatedAt.toISOString(),
      },
    });
  }),
);

router.delete(
  "/webhooks/:id",
  requireAuth,
  requirePermission("integrations:write"),
  asyncHandler(async (req, res) => {
    const hook = await WebhookSubscription.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user!.orgId,
    });
    if (!hook) throw notFound("Webhook não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "webhook",
      entityId: hook._id.toString(),
      summary: `Webhook ${hook.eventType} excluído`,
    });

    res.json({ ok: true });
  }),
);

export { router as webhookRoutes };
