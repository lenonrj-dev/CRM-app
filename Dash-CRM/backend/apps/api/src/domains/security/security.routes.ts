import { Router } from "express";
import { z } from "zod";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { randomBytes } from "crypto";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, forbidden, notFound } from "../../utils/apiError";
import { User } from "../auth/user.model";
import { RefreshToken } from "../auth/refreshToken.model";
import { hashToken } from "../../utils/hash";
import { getSecurityPolicy } from "./security.service";
import { AuditLog } from "../settings/auditLog.model";

const router = Router();

const policySchema = z.object({
  password: z
    .object({
      minLength: z.number().min(6).max(128).optional(),
      requireUpper: z.boolean().optional(),
      requireLower: z.boolean().optional(),
      requireNumber: z.boolean().optional(),
      requireSpecial: z.boolean().optional(),
    })
    .optional(),
  sessionTtlDays: z.number().min(1).max(365).optional(),
  requireTwoFactor: z.boolean().optional(),
  allowedOrigins: z.array(z.string().min(3)).optional(),
});

const sessionRevokeSchema = z.object({
  sessionId: z.string().min(6),
});

const twoFactorSchema = z.object({
  code: z.string().min(6),
});

const generateBackupCodes = (count = 6) =>
  Array.from({ length: count }, () => randomBytes(4).toString("hex"));

router.get(
  "/policies",
  requireAuth,
  requirePermission("security:read"),
  asyncHandler(async (req, res) => {
    const policy = await getSecurityPolicy(req.user!.orgId);
    res.json({
      policy: {
        orgId: policy.orgId.toString(),
        password: policy.password,
        sessionTtlDays: policy.sessionTtlDays,
        requireTwoFactor: policy.requireTwoFactor,
        allowedOrigins: policy.allowedOrigins ?? [],
        updatedAt: policy.updatedAt.toISOString(),
      },
    });
  }),
);

router.put(
  "/policies",
  requireAuth,
  requirePermission("security:write"),
  asyncHandler(async (req, res) => {
    const updates = policySchema.parse(req.body);
    const policy = await getSecurityPolicy(req.user!.orgId);
    const data = "password" in updates ? { ...policy.password, ...updates.password } : policy.password;

    policy.password = data;
    if (updates.sessionTtlDays !== undefined) policy.sessionTtlDays = updates.sessionTtlDays;
    if (updates.requireTwoFactor !== undefined) policy.requireTwoFactor = updates.requireTwoFactor;
    if (updates.allowedOrigins !== undefined) policy.allowedOrigins = updates.allowedOrigins;
    await policy.save();

    res.json({
      policy: {
        orgId: policy.orgId.toString(),
        password: policy.password,
        sessionTtlDays: policy.sessionTtlDays,
        requireTwoFactor: policy.requireTwoFactor,
        allowedOrigins: policy.allowedOrigins ?? [],
        updatedAt: policy.updatedAt.toISOString(),
      },
    });
  }),
);

router.get(
  "/sessions",
  requireAuth,
  requirePermission("security:read"),
  asyncHandler(async (req, res) => {
    const userId = req.query.userId?.toString() ?? req.user!.id;
    if (userId !== req.user!.id && req.user!.role !== "ADMIN" && req.user!.role !== "MANAGER") {
      throw forbidden("Não permitido");
    }

    const sessions = await RefreshToken.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({
      items: sessions.map((session) => ({
        id: session._id.toString(),
        userId: session.userId.toString(),
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        revokedAt: session.revokedAt?.toISOString() ?? null,
      })),
    });
  }),
);

router.post(
  "/sessions/revoke",
  requireAuth,
  requirePermission("security:read"),
  asyncHandler(async (req, res) => {
    const { sessionId } = sessionRevokeSchema.parse(req.body);
    const session = await RefreshToken.findById(sessionId);
    if (!session) throw notFound("Sessão não encontrada");
    if (session.userId.toString() !== req.user!.id && req.user!.role !== "ADMIN") {
      throw forbidden("Não permitido");
    }
    session.revokedAt = new Date();
    await session.save();
    res.json({ ok: true });
  }),
);

router.post(
  "/sessions/revoke-all",
  requireAuth,
  requirePermission("security:write"),
  asyncHandler(async (req, res) => {
    const targetId = (req.body?.userId as string | undefined) ?? req.user!.id;
    if (targetId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw forbidden("Não permitido");
    }
    await RefreshToken.updateMany({ userId: targetId }, { revokedAt: new Date() }).exec();
    res.json({ ok: true });
  }),
);

router.post(
  "/2fa/setup",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw notFound("Usuário não encontrado");

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, "Ateliux CRM", secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    const backupCodes = generateBackupCodes();

    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false;
    user.twoFactorVerifiedAt = undefined;
    user.twoFactorBackupCodes = backupCodes.map((code) => hashToken(code));
    await user.save();

    res.json({ qrCodeDataUrl, secret, otpauthUrl, backupCodes });
  }),
);

router.post(
  "/2fa/verify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { code } = twoFactorSchema.parse(req.body);
    const user = await User.findById(req.user!.id);
    if (!user || !user.twoFactorSecret) throw badRequest("2FA não configurado");

    const codeHash = hashToken(code);
    const matchesBackup = user.twoFactorBackupCodes?.includes(codeHash);
    const isValid =
      authenticator.check(code, user.twoFactorSecret) || matchesBackup;

    if (!isValid) throw badRequest("Código 2FA inválido");

    if (matchesBackup) {
      user.twoFactorBackupCodes = user.twoFactorBackupCodes?.filter((item) => item !== codeHash);
    }
    user.twoFactorEnabled = true;
    user.twoFactorVerifiedAt = new Date();
    await user.save();

    res.json({ enabled: true, backupCodesRemaining: user.twoFactorBackupCodes?.length ?? 0 });
  }),
);

router.post(
  "/2fa/disable",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { code } = twoFactorSchema.parse(req.body);
    const user = await User.findById(req.user!.id);
    if (!user || !user.twoFactorSecret) throw badRequest("2FA não configurado");

    const codeHash = hashToken(code);
    const matchesBackup = user.twoFactorBackupCodes?.includes(codeHash);
    const isValid =
      authenticator.check(code, user.twoFactorSecret) || matchesBackup;

    if (!isValid) throw badRequest("Código 2FA inválido");

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorVerifiedAt = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    await AuditLog.create({
      orgId: user.orgId,
      userId: user._id,
      role: user.role,
      action: "UPDATE",
      entity: "security",
      summary: "2FA desativado",
    });

    res.json({ enabled: false });
  }),
);

export { router as securityRoutes };
