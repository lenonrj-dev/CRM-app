import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { UserMembership } from "./membership.model";
import { User } from "../auth/user.model";
import { membershipStatusValues, roleValues, visibilityScopeValues } from "@ateliux/shared";
import { badRequest, notFound } from "../../utils/apiError";
import { logAuditEvent } from "../../utils/audit";

const router = Router();

const membershipSchema = z.object({
  userId: z.string().min(6),
  unitId: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
  role: z.enum(roleValues),
  scope: z.enum(visibilityScopeValues),
  status: z.enum(membershipStatusValues),
});

router.get(
  "/members",
  requireAuth,
  requirePermission("org:read"),
  asyncHandler(async (req, res) => {
    const memberships = await UserMembership.find({ orgId: req.user!.orgId }).lean();
    const userIds = memberships.map((member) => member.userId.toString());
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    res.json({
      items: memberships.map((member) => {
        const user = userMap.get(member.userId.toString());
        return {
          id: member._id.toString(),
          userId: member.userId.toString(),
          orgId: member.orgId.toString(),
          unitId: member.unitId?.toString(),
          teamIds: member.teamIds?.map((id) => id.toString()) ?? [],
          role: member.role,
          scope: member.scope,
          status: member.status,
          user: user
            ? { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
            : null,
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
        };
      }),
    });
  }),
);

router.post(
  "/members",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const data = membershipSchema.parse(req.body);
    const user = await User.findById(data.userId);
    if (!user) throw notFound("Usuário não encontrado");
    if (user.orgId.toString() !== req.user!.orgId) {
      throw badRequest("Usuário pertence a outra organização");
    }

    const membership = await UserMembership.create({
      userId: user._id,
      orgId: req.user!.orgId,
      unitId: data.unitId,
      teamIds: data.teamIds ?? [],
      role: data.role,
      scope: data.scope,
      status: data.status,
    });

    if (user.role !== data.role) {
      user.role = data.role;
      await user.save();
    }

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "membership",
      entityId: membership._id.toString(),
      summary: `Vínculo criado para ${user.email}`,
    });

    res.status(201).json({
      membership: {
        id: membership._id.toString(),
        userId: membership.userId.toString(),
        orgId: membership.orgId.toString(),
        unitId: membership.unitId?.toString(),
        teamIds: membership.teamIds?.map((id) => id.toString()) ?? [],
        role: membership.role,
        scope: membership.scope,
        status: membership.status,
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
      },
    });
  }),
);

router.patch(
  "/members/:id",
  requireAuth,
  requirePermission("org:write"),
  asyncHandler(async (req, res) => {
    const updates = membershipSchema.partial().parse(req.body);
    const membership = await UserMembership.findOne({ _id: req.params.id, orgId: req.user!.orgId });
    if (!membership) throw notFound("Vínculo não encontrado");

    const prevStatus = membership.status;

    Object.assign(membership, updates);
    await membership.save();

    if (updates.role) {
      const user = await User.findById(membership.userId);
      if (user && user.role !== updates.role) {
        user.role = updates.role;
        await user.save();
      }
    }

    const statusSummary = updates.status
      ? updates.status === "DISABLED"
        ? "Usuário desativado"
        : updates.status === "ACTIVE" && prevStatus === "DISABLED"
          ? "Usuário reativado"
          : "Status do vínculo atualizado"
      : "Vínculo atualizado";

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "membership",
      entityId: membership._id.toString(),
      summary: statusSummary,
    });

    res.json({
      membership: {
        id: membership._id.toString(),
        userId: membership.userId.toString(),
        orgId: membership.orgId.toString(),
        unitId: membership.unitId?.toString(),
        teamIds: membership.teamIds?.map((id) => id.toString()) ?? [],
        role: membership.role,
        scope: membership.scope,
        status: membership.status,
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
      },
    });
  }),
);

export { router as memberRoutes };
