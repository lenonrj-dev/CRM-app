import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/apiError";
import { Organization } from "../auth/organization.model";
import { resolveOrgSlug } from "./org.service";
import { toOrganizationDto } from "../auth/auth.mappers";
import { logAuditEvent } from "../../utils/audit";

const router = Router();

const orgUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  currency: z.string().min(2).optional(),
  timezone: z.string().min(2).optional(),
  onboardingCompleted: z.boolean().optional(),
});

router.get(
  "/",
  requireAuth,
  requirePermission("org:read"),
  asyncHandler(async (req, res) => {
    const org = await Organization.findById(req.user!.orgId).lean();
    if (!org) throw notFound("Organização não encontrada");
    res.json({ organization: toOrganizationDto(org) });
  }),
);

router.patch(
  "/",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const updates = orgUpdateSchema.parse(req.body);
    const org = await Organization.findById(req.user!.orgId);
    if (!org) throw notFound("Organização não encontrada");

    if (updates.name) {
      org.name = updates.name;
      org.slug = await resolveOrgSlug(updates.name, org._id.toString());
    }

    if (updates.slug) {
      org.slug = await resolveOrgSlug(updates.slug, org._id.toString());
    }

    if (updates.currency) org.currency = updates.currency;
    if (updates.timezone) org.timezone = updates.timezone;
    if (typeof updates.onboardingCompleted === "boolean") {
      org.onboardingCompleted = updates.onboardingCompleted;
    }

    await org.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "org",
      entityId: org._id.toString(),
      summary: "Organização atualizada",
    });

    res.json({ organization: toOrganizationDto(org) });
  }),
);

export { router as orgSettingsRoutes };
