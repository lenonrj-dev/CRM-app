import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticator } from "otplib";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError, badRequest } from "../../utils/apiError";
import { User } from "./user.model";
import { RefreshToken } from "./refreshToken.model";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { addDuration } from "../../utils/time";
import { hashToken } from "../../utils/hash";
import { requireAuth } from "../../middleware/requireAuth";
import { AuditLog } from "../settings/auditLog.model";
import { env } from "../../config/env";
import { getSecurityPolicy, validatePassword } from "../security/security.service";
import { UserMembership } from "../org/membership.model";
import { Organization } from "./organization.model";
import { toUserDto } from "./auth.mappers";
import { resolveOrgSlug } from "../org/org.service";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  twoFactorCode: z.string().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const getIp = (req: any) =>
  (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
  req.socket.remoteAddress;

const verifyTwoFactorCode = (user: any, code?: string) => {
  if (!user.twoFactorEnabled || !user.twoFactorSecret) return { ok: true, usedBackup: false };
  if (!code) return { ok: false, usedBackup: false };
  const codeHash = hashToken(code);
  const matchesBackup = user.twoFactorBackupCodes?.includes(codeHash);
  const matchesTotp = authenticator.check(code, user.twoFactorSecret);
  return { ok: matchesTotp || matchesBackup, usedBackup: matchesBackup, codeHash };
};

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const email = data.email.toLowerCase();
    const existing = await User.findOne({ email }).lean();
    if (existing) throw badRequest("E-mail já está cadastrado");

    const slug = await resolveOrgSlug(data.orgName);
    const org = await Organization.create({
      name: data.orgName,
      slug,
      plan: "FREE",
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      onboardingCompleted: false,
    });

    const policy = await getSecurityPolicy(org._id.toString());
    const validation = validatePassword(data.password, policy.password);
    if (!validation.ok) {
      throw badRequest("Senha não atende à política de segurança");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email,
      passwordHash,
      role: "OWNER",
      orgId: org._id,
    });

    const membership = await UserMembership.create({
      userId: user._id,
      orgId: org._id,
      role: "OWNER",
      scope: "ORG",
      status: "ACTIVE",
    });

    const payload = { sub: user._id.toString(), role: membership.role, orgId: org._id.toString() };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await RefreshToken.create({
      userId: user._id,
      orgId: org._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDuration(env.jwtRefreshTtl),
      ip: getIp(req),
      userAgent: req.headers["user-agent"],
    });

    await AuditLog.create({
      orgId: org._id,
      userId: user._id,
      role: user.role,
      action: "CREATE",
      entity: "auth",
      summary: "Conta criada",
      ip: getIp(req),
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      user: toUserDto(user, org, [membership]),
      accessToken,
      refreshToken,
      requiresTwoFactorSetup: policy.requireTwoFactor && !user.twoFactorEnabled,
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password, twoFactorCode } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).exec();
    if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Email ou senha inválidos");

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw new ApiError(401, "INVALID_CREDENTIALS", "Email ou senha inválidos");

    const membership = await UserMembership.findOne({
      userId: user._id,
      orgId: user.orgId,
      status: "ACTIVE",
    }).lean();
    if (!membership) {
      throw new ApiError(403, "MEMBERSHIP_INACTIVE", "Acesso da organização não está ativo");
    }

    const twoFactor = verifyTwoFactorCode(user, twoFactorCode);
    if (!twoFactor.ok) {
      return res.status(403).json({
        code: "TWO_FACTOR_REQUIRED",
        message: "Código de autenticação obrigatório",
        requiresTwoFactor: true,
      });
    }

    if (twoFactor.usedBackup && twoFactor.codeHash) {
      user.twoFactorBackupCodes = user.twoFactorBackupCodes?.filter(
        (item: string) => item !== twoFactor.codeHash,
      );
    }

    if (user.role !== membership.role) {
      user.role = membership.role;
    }
    user.lastLoginAt = new Date();
    await user.save();

    const payload = { sub: user._id.toString(), role: membership.role, orgId: user.orgId.toString() };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const memberships = await UserMembership.find({ userId: user._id, orgId: user.orgId }).lean();
    const org = await Organization.findById(user.orgId).lean();
    if (!org) throw badRequest("Organização não encontrada");

    await RefreshToken.create({
      userId: user._id,
      orgId: user.orgId,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDuration(env.jwtRefreshTtl),
      ip: getIp(req),
      userAgent: req.headers["user-agent"],
    });

    await AuditLog.create({
      orgId: user.orgId,
      userId: user._id,
      role: user.role,
      action: "LOGIN",
      entity: "auth",
      summary: "Usuário entrou",
      ip: getIp(req),
      userAgent: req.headers["user-agent"],
    });

    const policy = await getSecurityPolicy(user.orgId.toString());

    res.json({
      user: toUserDto(user, org, memberships),
      accessToken,
      refreshToken,
      requiresTwoFactorSetup: policy.requireTwoFactor && !user.twoFactorEnabled,
    });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);

    const stored = await RefreshToken.findOne({
      userId: payload.sub,
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
    }).exec();

    if (!stored || stored.expiresAt < new Date()) {
      throw new ApiError(401, "INVALID_REFRESH", "Token de atualização inválido");
    }

    const membership = await UserMembership.findOne({
      userId: payload.sub,
      orgId: payload.orgId,
      status: "ACTIVE",
    }).lean();
    if (!membership) {
      throw new ApiError(403, "MEMBERSHIP_INACTIVE", "Acesso da organização não está ativo");
    }

    stored.revokedAt = new Date();
    await stored.save();

    const newPayload = { sub: payload.sub, role: membership.role, orgId: payload.orgId };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await RefreshToken.create({
      userId: payload.sub,
      orgId: payload.orgId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: addDuration(env.jwtRefreshTtl),
      ip: getIp(req),
      userAgent: req.headers["user-agent"],
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  }),
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.updateMany({ tokenHash }, { revokedAt: new Date() }).exec();

    await AuditLog.create({
      orgId: req.user!.orgId,
      userId: req.user!.id,
      role: req.user!.role,
      action: "LOGOUT",
      entity: "auth",
      summary: "Usuário saiu",
      ip: getIp(req),
      userAgent: req.headers["user-agent"],
    });

    res.json({ ok: true });
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).exec();
    if (!user) throw badRequest("Usuário não encontrado");
    const memberships = await UserMembership.find({ userId: user._id, orgId: user.orgId }).lean();
    const org = await Organization.findById(user.orgId).lean();
    if (!org) throw badRequest("Organização não encontrada");
    res.json({ user: toUserDto(user, org, memberships) });
  }),
);

export { router as authRoutes };
