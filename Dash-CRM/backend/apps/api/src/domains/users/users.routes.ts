import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requirePermission";
import { User } from "../auth/user.model";
import { UserMembership } from "../org/membership.model";
import { roleValues } from "@ateliux/shared";
import { logAuditEvent } from "../../utils/audit";
import { badRequest, notFound } from "../../utils/apiError";
import { getSecurityPolicy, validatePassword } from "../security/security.service";

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(roleValues),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(roleValues).optional(),
});

const toUserDto = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  orgId: user.orgId.toString(),
  twoFactorEnabled: user.twoFactorEnabled ?? false,
  createdAt: user.createdAt.toISOString(),
});

router.get(
  "/",
  requireAuth,
  requireRole(["OWNER", "ADMIN", "MANAGER"]),
  asyncHandler(async (req, res) => {
    const users = await User.find({ orgId: req.user!.orgId }).sort({ createdAt: -1 }).lean();
    res.json({ items: users.map(toUserDto) });
  }),
);

router.post(
  "/",
  requireAuth,
  requireRole(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    const policy = await getSecurityPolicy(req.user!.orgId);
    const validation = validatePassword(data.password, policy.password);
    if (!validation.ok) {
      throw badRequest("Violação da política de senha");
    }
    const existing = await User.findOne({ email: data.email }).lean();
    if (existing) throw badRequest("E-mail já cadastrado");
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role,
      orgId: req.user!.orgId,
    });

    await UserMembership.create({
      userId: user._id,
      orgId: req.user!.orgId,
      role: data.role,
      scope: "ORG",
      status: "ACTIVE",
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "user",
      entityId: user._id.toString(),
      summary: `Usuário ${user.email} criado`,
    });

    res.status(201).json({ user: toUserDto(user) });
  }),
);

router.put(
  "/:id",
  requireAuth,
  requireRole(["OWNER", "ADMIN"]),
  asyncHandler(async (req, res) => {
    const updates = updateUserSchema.parse(req.body);
    const user = await User.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!user) throw notFound("Usuário não encontrado");

    if (updates.name) user.name = updates.name;
    if (updates.role) user.role = updates.role;
    await user.save();

    if (updates.role) {
      await UserMembership.updateMany(
        { userId: user._id, orgId: req.user!.orgId },
        { role: updates.role },
      ).exec();
    }

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "user",
      entityId: user._id.toString(),
      summary: `Usuário ${user.email} atualizado`,
    });

    res.json({ user: toUserDto(user) });
  }),
);

export { router as userRoutes };
