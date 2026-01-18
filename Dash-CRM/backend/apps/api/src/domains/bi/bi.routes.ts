import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Deal } from "../crm/deal.model";
import { Ticket } from "../support/ticket.model";
import { CustomerSuccessProfile } from "../cs/csProfile.model";
import { getCache, setCache } from "../../utils/cache";
import { buildVisibilityQuery } from "../security/authorization.service";

const router = Router();

router.get(
  "/revenue",
  requireAuth,
  requirePermission("bi:read"),
  asyncHandler(async (req, res) => {
    const months = Math.min(24, Number(req.query.months ?? 6));
    const groupBy = String(req.query.groupBy ?? "month");
    const key = `bi:revenue:${req.user!.orgId}:${months}:${groupBy}`;
    const cached = getCache<any>(key);
    if (cached) return res.json(cached);

    const end = new Date();
    const start = new Date(end);
    start.setMonth(start.getMonth() - months);

    const match: Record<string, any> = {
      orgId: req.user!.orgId,
      stage: { $ne: "LOST" },
      expectedCloseDate: { $gte: start, $lte: end },
      ...buildVisibilityQuery(req.user!),
    };

    const group =
      groupBy === "channel"
        ? { channel: "$attribution.lastTouch.utm.source" }
        : { month: { $dateToString: { date: "$expectedCloseDate", format: "%Y-%m" } } };

    const items = await Deal.aggregate([
      { $match: match },
      { $group: { _id: group, revenue: { $sum: "$value" } } },
      { $sort: { "_id.month": 1 } },
    ]);

    const response = {
      items: items.map((row) => ({
        month: row._id.month,
        channel: row._id.channel ?? undefined,
        revenue: row.revenue,
      })),
      range: { start: start.toISOString(), end: end.toISOString() },
    };

    setCache(key, response);
    res.json(response);
  }),
);

router.get(
  "/pipeline",
  requireAuth,
  requirePermission("bi:read"),
  asyncHandler(async (req, res) => {
    const key = `bi:pipeline:${req.user!.orgId}`;
    const cached = getCache<any>(key);
    if (cached) return res.json(cached);

    const items = await Deal.aggregate([
      { $match: { orgId: req.user!.orgId, ...buildVisibilityQuery(req.user!) } },
      { $group: { _id: "$stage", total: { $sum: "$value" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const response = {
      items: items.map((row) => ({ stage: row._id, total: row.total, count: row.count })),
    };

    setCache(key, response);
    res.json(response);
  }),
);

router.get(
  "/support",
  requireAuth,
  requirePermission("bi:read"),
  asyncHandler(async (req, res) => {
    const key = `bi:support:${req.user!.orgId}`;
    const cached = getCache<any>(key);
    if (cached) return res.json(cached);

    const items = await Ticket.aggregate([
      { $match: { orgId: req.user!.orgId, ...buildVisibilityQuery(req.user!, { ownerField: "assignedTo" }) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const response = {
      items: items.map((row) => ({ status: row._id, count: row.count })),
    };
    setCache(key, response);
    res.json(response);
  }),
);

router.get(
  "/cs",
  requireAuth,
  requirePermission("bi:read"),
  asyncHandler(async (req, res) => {
    const key = `bi:cs:${req.user!.orgId}`;
    const cached = getCache<any>(key);
    if (cached) return res.json(cached);

    const items = await CustomerSuccessProfile.aggregate([
      { $match: { orgId: req.user!.orgId } },
      {
        $group: {
          _id: "$lifecycleStage",
          count: { $sum: 1 },
          avgHealthScore: { $avg: "$healthScore" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const response = {
      items: items.map((row) => ({
        lifecycleStage: row._id,
        count: row.count,
        avgHealthScore: Math.round(row.avgHealthScore ?? 0),
      })),
    };
    setCache(key, response);
    res.json(response);
  }),
);

export { router as biRoutes };
