import { Router } from "express";
import { z } from "zod";
import { ticketPriorityValues, ticketStatusValues, visibilityScopeValues } from "@ateliux/shared";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requirePermission } from "../../middleware/requirePermission";
import { Ticket } from "./ticket.model";
import { buildDiff } from "../../utils/diff";
import { logAuditEvent } from "../../utils/audit";
import { notFound } from "../../utils/apiError";
import { emitEvent } from "../events/event.service";
import { buildVisibilityQuery } from "../security/authorization.service";

const router = Router();

const ticketSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(ticketStatusValues),
  priority: z.enum(ticketPriorityValues),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  assignedTo: z.string().optional(),
  unitId: z.string().optional(),
  teamId: z.string().optional(),
  visibilityScope: z.enum(visibilityScopeValues).optional(),
});

const commentSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().optional(),
});

const toTicketDto = (ticket: any, role?: string) => ({
  id: ticket._id.toString(),
  orgId: ticket.orgId.toString(),
  title: ticket.title,
  description: ticket.description,
  status: ticket.status,
  priority: ticket.priority,
  createdBy: ticket.createdBy?.toString(),
  companyId: ticket.companyId?.toString(),
  contactId: ticket.contactId?.toString(),
  assignedTo: ticket.assignedTo?.toString(),
  unitId: ticket.unitId?.toString(),
  teamId: ticket.teamId?.toString(),
  visibilityScope: ticket.visibilityScope,
  comments: ticket.comments
    ?.filter((comment: any) => (role === "CLIENT" ? !comment.isInternal : true))
    .map((comment: any) => ({
      id: comment._id.toString(),
      authorId: comment.authorId.toString(),
      body: comment.body,
      isInternal: comment.isInternal,
      createdAt: comment.createdAt.toISOString(),
    })),
  createdAt: ticket.createdAt.toISOString(),
  updatedAt: ticket.updatedAt.toISOString(),
});

const resolveDefaults = (req: any, data: z.infer<typeof ticketSchema>) => {
  const unitId = data.unitId ?? req.user!.unitId;
  const teamId = data.teamId ?? req.user!.teamIds?.[0];
  const visibilityScope = data.visibilityScope ?? (teamId ? "TEAM" : unitId ? "UNIT" : "ORG");
  return { unitId, teamId, visibilityScope };
};

const buildTicketQuery = (req: any) => {
  if (req.user?.role === "CLIENT") {
    return { orgId: req.user.orgId, createdBy: req.user.id };
  }
  return {
    orgId: req.user!.orgId,
    ...buildVisibilityQuery(req.user!, { ownerField: "assignedTo" }),
  };
};

router.get(
  "/",
  requireAuth,
  requirePermission("support:read"),
  asyncHandler(async (req, res) => {
    const filters: Record<string, any> = buildTicketQuery(req);
    if (req.query.status) filters.status = String(req.query.status);
    if (req.query.priority) filters.priority = String(req.query.priority);

    const items = await Ticket.find(filters).sort({ createdAt: -1 }).lean();
    res.json({ items: items.map((ticket) => toTicketDto(ticket, req.user?.role)) });
  }),
);

router.post(
  "/",
  requireAuth,
  requirePermission("support:write"),
  asyncHandler(async (req, res) => {
    const data = ticketSchema.parse(req.body);
    const defaults = resolveDefaults(req, data);
    const ticket = await Ticket.create({
      ...data,
      ...defaults,
      orgId: req.user!.orgId,
      createdBy: req.user!.id,
    });

    await logAuditEvent({
      req,
      action: "CREATE",
      entity: "ticket",
      entityId: ticket._id.toString(),
      summary: `Chamado ${ticket.title} criado`,
    });

    await emitEvent({
      orgId: req.user!.orgId,
      type: "ticket.created",
      payload: {
        companyId: ticket.companyId?.toString(),
        contactId: ticket.contactId?.toString(),
        ticketId: ticket._id.toString(),
        priority: ticket.priority,
        status: ticket.status,
        ownerId: ticket.assignedTo?.toString(),
        initiatedBy: { userId: req.user!.id, role: req.user!.role },
      },
    });

    res.status(201).json({ ticket: toTicketDto(ticket, req.user?.role) });
  }),
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("support:read"),
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      ...buildTicketQuery(req),
    }).lean();
    if (!ticket) throw notFound("Chamado não encontrado");
    res.json({ ticket: toTicketDto(ticket, req.user?.role) });
  }),
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("support:write"),
  asyncHandler(async (req, res) => {
    const data = ticketSchema.partial().parse(req.body);
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      ...buildTicketQuery(req),
    });
    if (!ticket) throw notFound("Chamado não encontrado");

    const before = ticket.toObject();
    Object.assign(ticket, data);
    await ticket.save();

    const changes = buildDiff(before, ticket.toObject(), [
      "title",
      "description",
      "status",
      "priority",
      "companyId",
      "contactId",
      "assignedTo",
      "unitId",
      "teamId",
      "visibilityScope",
    ]);

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "ticket",
      entityId: ticket._id.toString(),
      summary: `Chamado ${ticket.title} atualizado`,
      changes,
    });

    res.json({ ticket: toTicketDto(ticket, req.user?.role) });
  }),
);

router.post(
  "/:id/comments",
  requireAuth,
  requirePermission("support:write"),
  asyncHandler(async (req, res) => {
    const data = commentSchema.parse(req.body);
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      ...buildTicketQuery(req),
    });
    if (!ticket) throw notFound("Chamado não encontrado");

    ticket.comments.push({
      authorId: req.user!.id as any,
      body: data.body,
      isInternal: req.user?.role === "CLIENT" ? false : data.isInternal ?? false,
      createdAt: new Date(),
    });

    await ticket.save();

    await logAuditEvent({
      req,
      action: "UPDATE",
      entity: "ticket",
      entityId: ticket._id.toString(),
      summary: `Comentário adicionado ao chamado ${ticket.title}`,
    });

    res.status(201).json({ ticket: toTicketDto(ticket, req.user?.role) });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("support:write"),
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOneAndDelete({
      _id: req.params.id,
      ...buildTicketQuery(req),
    });
    if (!ticket) throw notFound("Chamado não encontrado");

    await logAuditEvent({
      req,
      action: "DELETE",
      entity: "ticket",
      entityId: ticket._id.toString(),
      summary: `Chamado ${ticket.title} excluído`,
    });

    res.json({ ok: true });
  }),
);

export { router as ticketRoutes };
