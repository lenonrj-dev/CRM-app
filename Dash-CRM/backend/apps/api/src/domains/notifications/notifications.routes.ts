import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Notification } from "./notification.model";
import { notFound } from "../../utils/apiError";

const router = Router();

const toNotificationDto = (notification: any) => ({
  id: notification._id.toString(),
  orgId: notification.orgId.toString(),
  userId: notification.userId.toString(),
  title: notification.title,
  message: notification.message,
  entity: notification.entity,
  entityId: notification.entityId,
  readAt: notification.readAt?.toISOString(),
  createdAt: notification.createdAt.toISOString(),
});

router.get(
  "/",
  requireAuth,
  requirePermission("notifications:read"),
  asyncHandler(async (req, res) => {
    const query: Record<string, any> = { orgId: req.user!.orgId, userId: req.user!.id };
    if (req.query.unread === "true") {
      query.readAt = null;
    }

    const items = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ items: items.map(toNotificationDto) });
  }),
);

const markSchema = z.object({ ids: z.array(z.string()).min(1) });

router.patch(
  "/",
  requireAuth,
  requirePermission("notifications:read"),
  asyncHandler(async (req, res) => {
    const data = markSchema.parse(req.body);
    await Notification.updateMany(
      { _id: { $in: data.ids }, orgId: req.user!.orgId, userId: req.user!.id },
      { readAt: new Date() },
    );
    res.json({ ok: true });
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("notifications:read"),
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      orgId: req.user!.orgId,
      userId: req.user!.id,
    });
    if (!notification) throw notFound("Notificação não encontrada");

    notification.readAt = new Date();
    await notification.save();

    res.json({ notification: toNotificationDto(notification) });
  }),
);

export { router as notificationRoutes };
