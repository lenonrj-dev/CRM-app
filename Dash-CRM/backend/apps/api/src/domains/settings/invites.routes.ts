import { Router } from "express";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Invite } from "./invite.model";
import { User } from "../auth/user.model";
import { UserMembership } from "../org/membership.model";
import { Organization } from "../auth/organization.model";
import { RefreshToken } from "../auth/refreshToken.model";
import { addDuration } from "../../utils/time";
import { hashToken } from "../../utils/hash";
import { env } from "../../config/env";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { getSecurityPolicy, validatePassword } from "../security/security.service";
import { badRequest, notFound } from "../../utils/apiError";
import { logAuditEvent } from "../../utils/audit";
import { roleValues } from "@ateliux/shared";
import { toUserDto } from "../auth/auth.mappers";
import { AuditLog } from "./auditLog.model";

const settingsRouter = Router();
const publicRouter = Router();

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(roleValues),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

const acceptInviteSchema = z.object({
  token: z.string().min(10),
  name: z.string().min(2),
  password: z.string().min(8),
});

const resolveInviteStatus = (invite: any) => {
  if (invite.usedAt) return "USED";
  if (invite.expiresAt && invite.expiresAt < new Date()) return "EXPIRED";
  return "PENDING";
};

settingsRouter.get(
  "/",
  requireAuth,
  requirePermission("users:read"),
  asyncHandler(async (req, res) => {
    const invites = (await Invite.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean()) as any[];
    res.json({
      items: invites.map((invite) => ({
        id: invite._id.toString(),
        orgId: invite.orgId.toString(),
        email: invite.email,
        role: invite.role,
        status: resolveInviteStatus(invite),
        expiresAt: new Date(invite.expiresAt).toISOString(),
        usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
        token: resolveInviteStatus(invite) === "PENDING" ? invite.token : undefined,
        createdAt: invite.createdAt.toISOString(),
      })),
    });
  }),
);

settingsRouter.post(
  "/",
  requireAuth,
  requirePermission("users:write"),
  asyncHandler(async (req, res) => {
    const data = createInviteSchema.parse(req.body);
    const email = data.email.toLowerCase();

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser && existingUser.orgId.toString() !== req.user!.orgId) {
      throw badRequest("Usuário pertence a outra organização");
    }
    if (existingUser) {
      const membership = await UserMembership.findOne({
        userId: existingUser._id,
        orgId: req.user!.orgId,
      }).lean();
      if (membership) {
        throw badRequest("Usuário já pertence a esta organização");
      }
    }

    await Invite.updateMany(
      { orgId: req.user!.orgId, email, usedAt: null },
      { usedAt: new Date() },
    ).exec();

    const token = randomBytes(32).toString("hex");
    const invite = await Invite.create({
      orgId: req.user!.orgId,
      email,
      role: data.role,
      token,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + (data.expiresInDays ?? 7) * 24 * 60 * 60 * 1000),
      createdBy: req.user!.id,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "invite",
      entityId: invite._id.toString(),
      summary: `Convite criado para ${email}`,
    });

    res.status(201).json({
      invite: {
        id: invite._id.toString(),
        orgId: invite.orgId.toString(),
        email: invite.email,
        role: invite.role,
        status: resolveInviteStatus(invite),
        expiresAt: new Date(invite.expiresAt).toISOString(),
        usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
        token: invite.token,
        createdAt: invite.createdAt.toISOString(),
      },
    });
  }),
);

publicRouter.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const tokenHash = hashToken(req.params.token);
    const invite = (await Invite.findOne({ tokenHash }).lean()) as any;
    if (!invite) throw notFound("Convite não encontrado");
    if (invite.usedAt) throw badRequest("Convite já utilizado");
    if (invite.expiresAt < new Date()) throw badRequest("Convite expirado");

    const org = await Organization.findById(invite.orgId).lean();
    if (!org) throw notFound("Organização não encontrada");

    res.json({
      invite: {
        id: invite._id.toString(),
        orgId: invite.orgId.toString(),
        email: invite.email,
        role: invite.role,
        status: resolveInviteStatus(invite),
        expiresAt: new Date(invite.expiresAt).toISOString(),
        usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
        createdAt: invite.createdAt.toISOString(),
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
      },
    });
  }),
);

publicRouter.post(
  "/accept",
  asyncHandler(async (req, res) => {
    const data = acceptInviteSchema.parse(req.body);
    const tokenHash = hashToken(data.token);
    const invite = await Invite.findOne({ tokenHash });
    if (!invite) throw notFound("Convite não encontrado");
    if (invite.usedAt) throw badRequest("Convite já utilizado");
    if (invite.expiresAt < new Date()) throw badRequest("Convite expirado");

    const org = await Organization.findById(invite.orgId);
    if (!org) throw notFound("Organização não encontrada");

    const policy = await getSecurityPolicy(invite.orgId.toString());
    const validation = validatePassword(data.password, policy.password);
    if (!validation.ok) {
      throw badRequest("Senha não atende à política de segurança");
    }

    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) throw badRequest("Usuário já existe. Faça login.");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      orgId: invite.orgId,
    });

    await UserMembership.create({
      userId: user._id,
      orgId: invite.orgId,
      role: invite.role,
      scope: "ORG",
      status: "ACTIVE",
    });

    invite.usedAt = new Date();
    await invite.save();

    const memberships = await UserMembership.find({ userId: user._id, orgId: invite.orgId }).lean();
    const payload = { sub: user._id.toString(), role: invite.role, orgId: invite.orgId.toString() };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await RefreshToken.create({
      userId: user._id,
      orgId: invite.orgId,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDuration(env.jwtRefreshTtl),
      ip: (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    await AuditLog.create({
      orgId: invite.orgId,
      userId: user._id,
      role: user.role,
      action: "UPDATE",
      entity: "invite",
      summary: "Convite aceito",
      ip: (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      user: toUserDto(user, org, memberships),
      accessToken,
      refreshToken,
    });
  }),
);

export { settingsRouter as inviteSettingsRoutes, publicRouter as invitePublicRoutes };
