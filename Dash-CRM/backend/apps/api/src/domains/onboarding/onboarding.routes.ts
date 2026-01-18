import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/apiError";
import { Organization } from "../auth/organization.model";
import { resolveOrgSlug } from "../org/org.service";
import { toOrganizationDto } from "../auth/auth.mappers";
import { logAuditEvent } from "../../utils/audit";
import { createDemoData } from "./onboarding.service";
import { Company } from "../crm/company.model";

const router = Router();

const onboardingSchema = z.object({
  orgName: z.string().min(2).optional(),
  currency: z.string().min(2).optional(),
  timezone: z.string().min(2).optional(),
  onboardingCompleted: z.boolean().optional(),
});

router.patch(
  "/",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const updates = onboardingSchema.parse(req.body);
    const org = await Organization.findById(req.user!.orgId);
    if (!org) throw notFound("Organização não encontrada");

    if (updates.orgName) {
      org.name = updates.orgName;
      org.slug = await resolveOrgSlug(updates.orgName, org._id.toString());
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
      summary: "Onboarding atualizado",
    });

    res.json({ organization: toOrganizationDto(org) });
  }),
);

router.post(
  "/demo",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const org = await Organization.findById(req.user!.orgId);
    if (!org) throw notFound("Organização não encontrada");

    const hasCompanies = await Company.exists({ orgId: org._id });
    if (!hasCompanies) {
      await createDemoData({ orgId: org._id.toString(), ownerId: req.user!.id });
    }

    org.onboardingCompleted = true;
    await org.save();

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "onboarding",
      entityId: org._id.toString(),
      summary: "Dados de demonstração carregados",
    });

    res.json({ ok: true, organization: toOrganizationDto(org) });
  }),
);

export { router as onboardingRoutes };
