import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { authRoutes } from "./domains/auth/auth.routes";
import { userRoutes } from "./domains/users/users.routes";
import { companyRoutes } from "./domains/crm/companies.routes";
import { contactRoutes } from "./domains/crm/contacts.routes";
import { dealRoutes } from "./domains/crm/deals.routes";
import { activityRoutes } from "./domains/crm/activities.routes";
import { ticketRoutes } from "./domains/support/tickets.routes";
import { auditLogRoutes } from "./domains/settings/auditLogs.routes";
import { marketingCampaignRoutes } from "./domains/marketing/campaigns.routes";
import { marketingRoutes } from "./domains/marketing/marketing.routes";
import { csProfileRoutes } from "./domains/cs/profiles.routes";
import { csContractRoutes } from "./domains/cs/contracts.routes";
import { salesCatalogRoutes } from "./domains/sales/catalog.routes";
import { salesProposalRoutes } from "./domains/sales/proposals.routes";
import { salesApprovalRoutes } from "./domains/sales/approvals.routes";
import { automationWorkflowRoutes } from "./domains/automation/workflows.routes";
import { automationRunRoutes } from "./domains/automation/runs.routes";
import { notificationRoutes } from "./domains/notifications/notifications.routes";
import { securityRoutes } from "./domains/security/security.routes";
import { unitRoutes } from "./domains/org/units.routes";
import { teamRoutes } from "./domains/org/teams.routes";
import { territoryRoutes } from "./domains/org/territories.routes";
import { memberRoutes } from "./domains/org/members.routes";
import { orgSettingsRoutes } from "./domains/org/orgSettings.routes";
import { webhookRoutes } from "./domains/integrations/webhooks.routes";
import { exportRoutes } from "./domains/exports/exports.routes";
import { biRoutes } from "./domains/bi/bi.routes";
import { complianceRoutes } from "./domains/compliance/compliance.routes";
import { searchRoutes } from "./domains/search/search.routes";
import { errorHandler } from "./middleware/errorHandler";
import { SecurityPolicy } from "./domains/security/securityPolicy.model";
import { invitePublicRoutes, inviteSettingsRoutes } from "./domains/settings/invites.routes";
import { onboardingRoutes } from "./domains/onboarding/onboarding.routes";

const baseOrigins = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = baseOrigins.includes("*");

const resolveCorsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin || allowAllOrigins || baseOrigins.includes(origin)) {
    return callback(null, true);
  }

  SecurityPolicy.exists({ allowedOrigins: origin })
    .then((exists) => callback(null, Boolean(exists)))
    .catch(() => callback(null, false));
};

const corsOptions = {
  origin: resolveCorsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));

  if (env.nodeEnv !== "production") {
    app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on("finish", () => {
        // eslint-disable-next-line no-console
        console.info(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`);
      });
      next();
    });
  }

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authLimiter, authRoutes);
  app.use("/users", userRoutes);
  app.use("/companies", companyRoutes);
  app.use("/contacts", contactRoutes);
  app.use("/deals", dealRoutes);
  app.use("/activities", activityRoutes);
  app.use("/tickets", ticketRoutes);
  app.use("/audit-logs", auditLogRoutes);
  app.use("/marketing", marketingCampaignRoutes);
  app.use("/marketing", marketingRoutes);
  app.use("/cs", csProfileRoutes);
  app.use("/cs", csContractRoutes);
  app.use("/sales", salesCatalogRoutes);
  app.use("/sales", salesProposalRoutes);
  app.use("/sales", salesApprovalRoutes);
  app.use("/automation", automationWorkflowRoutes);
  app.use("/automation", automationRunRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/security", securityRoutes);
  app.use("/onboarding", onboardingRoutes);
  app.use("/settings/invites", inviteSettingsRoutes);
  app.use("/invites", invitePublicRoutes);
  app.use("/settings/org", orgSettingsRoutes);
  app.use("/settings/org", unitRoutes);
  app.use("/settings/org", teamRoutes);
  app.use("/settings/org", territoryRoutes);
  app.use("/settings/org", memberRoutes);
  app.use("/integrations", webhookRoutes);
  app.use("/exports", exportRoutes);
  app.use("/bi", biRoutes);
  app.use("/compliance", complianceRoutes);
  app.use("/search", searchRoutes);

  app.use((_req, res) => res.status(404).json({ message: "Nao encontrado", code: "NOT_FOUND" }));
  app.use(errorHandler);

  return app;
};
