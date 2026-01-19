import type { Role, WorkflowAction, WorkflowCondition, WorkflowTriggerType } from "@ateliux/shared";
import { Workflow } from "./workflow.model";
import { WorkflowRun } from "./workflowRun.model";
import { Activity } from "../crm/activity.model";
import { Ticket } from "../support/ticket.model";
import { Deal } from "../crm/deal.model";
import { Company } from "../crm/company.model";
import { Contact } from "../crm/contact.model";
import { Notification } from "../notifications/notification.model";
import { AuditLog } from "../settings/auditLog.model";
import { User } from "../auth/user.model";
import { emitEvent } from "../events/event.service";

const evaluateCondition = (payload: Record<string, any>, condition: WorkflowCondition) => {
  const value = payload[condition.field];
  switch (condition.op) {
    case "eq":
      return value === condition.value;
    case "neq":
      return value !== condition.value;
    case "gt":
      return Number(value) > Number(condition.value);
    case "gte":
      return Number(value) >= Number(condition.value);
    case "lt":
      return Number(value) < Number(condition.value);
    case "lte":
      return Number(value) <= Number(condition.value);
    case "contains":
      return String(value ?? "").includes(String(condition.value));
    default:
      return false;
  }
};

const resolveUsersByRole = async (orgId: string, role?: Role) => {
  if (!role) return [];
  return User.find({ orgId, role }).lean();
};

const resolveSingleUserId = async (orgId: string, userId?: string, role?: Role) => {
  if (userId) return userId;
  const users = await resolveUsersByRole(orgId, role);
  return users[0]?._id.toString();
};

const createSystemAudit = async (params: {
  orgId: string;
  entity: string;
  entityId?: string;
  summary: string;
  initiatedBy?: { userId: string; role: Role };
}) => {
  const { orgId, entity, entityId, summary, initiatedBy } = params;
  const fallbackUser = initiatedBy ? null : await User.findOne({ orgId, role: "ADMIN" }).lean();
  const userId = initiatedBy?.userId ?? fallbackUser?._id?.toString();
  const role = initiatedBy?.role ?? fallbackUser?.role;

  if (!userId || !role) return;

  await AuditLog.create({
    orgId,
    userId,
    role,
    action: "UPDATE",
    entity,
    entityId,
    summary,
  });
};

const runAction = async (params: {
  orgId: string;
  action: WorkflowAction;
  payload: Record<string, any>;
}) => {
  const { orgId, action, payload } = params;
  const data = action.payload ?? {};

  switch (action.type) {
    case "CREATE_ACTIVITY": {
      const dueInMinutes = Number(data.dueInMinutes ?? 0);
      const dueInDays = Number(data.dueInDays ?? 0);
      const dueDate = dueInMinutes || dueInDays
        ? new Date(Date.now() + (dueInMinutes * 60 + dueInDays * 24 * 60) * 60 * 1000)
        : undefined;
      const ownerId = await resolveSingleUserId(orgId, data.ownerId as string | undefined, data.ownerRole as Role);

      const activity = await Activity.create({
        orgId,
        type: "TASK",
        subject: String(data.subject ?? "Tarefa automatica"),
        notes: data.notes ? String(data.notes) : undefined,
        dueDate,
        completed: false,
        companyId: data.companyId ?? payload.companyId,
        contactId: data.contactId ?? payload.contactId,
        dealId: data.dealId ?? payload.dealId,
        ownerId,
      });
      return `Atividade ${activity._id.toString()} criada`;
    }
    case "ASSIGN_OWNER": {
      const ownerId = await resolveSingleUserId(orgId, data.ownerId as string | undefined, data.ownerRole as Role);
      const entity = String(data.entity ?? "");
      if (!ownerId) return "Nenhum responsavel encontrado";

      if (entity === "deal" && payload.dealId) {
        await Deal.updateOne({ _id: payload.dealId, orgId }, { ownerId });
        return "Responsavel da oportunidade definido";
      }
      if (entity === "company" && payload.companyId) {
        await Company.updateOne({ _id: payload.companyId, orgId }, { ownerId });
        return "Responsavel da empresa definido";
      }
      if (entity === "contact" && payload.contactId) {
        await Contact.updateOne({ _id: payload.contactId, orgId }, { ownerId });
        return "Responsavel do contato definido";
      }
      if (entity === "ticket" && payload.ticketId) {
        await Ticket.updateOne({ _id: payload.ticketId, orgId }, { assignedTo: ownerId });
        return "Responsavel do chamado definido";
      }
      return "Atribuicao de responsavel ignorada";
    }
    case "CREATE_TICKET": {
      const ownerId = await resolveSingleUserId(orgId, data.ownerId as string | undefined, data.ownerRole as Role);
      const ticket = await Ticket.create({
        orgId,
        title: String(data.title ?? "Chamado automatico"),
        description: data.description ? String(data.description) : undefined,
        status: data.status ?? "OPEN",
        priority: data.priority ?? "MEDIUM",
        companyId: data.companyId ?? payload.companyId,
        contactId: data.contactId ?? payload.contactId,
        assignedTo: ownerId,
        comments: [],
      });
      return `Chamado ${ticket._id.toString()} criado`;
    }
    case "NOTIFY_IN_APP": {
      if (data.userId) {
        await Notification.create({
          orgId,
          userId: data.userId,
          title: String(data.title ?? "Notificacao"),
          message: String(data.message ?? ""),
          entity: data.entity ?? payload.entity,
          entityId: data.entityId ?? payload.entityId,
        });
        return "Notificacao criada";
      }

      const users = await resolveUsersByRole(orgId, data.role as Role);
      await Promise.all(
        users.map((user) =>
          Notification.create({
            orgId,
            userId: user._id,
            title: String(data.title ?? "Notificacao"),
            message: String(data.message ?? ""),
            entity: data.entity ?? payload.entity,
            entityId: data.entityId ?? payload.entityId,
          }),
        ),
      );
      return `Notificacao enviada para ${users.length} usuarios`;
    }
    case "UPDATE_DEAL_STAGE": {
      if (!payload.dealId) return "Nenhuma oportunidade para atualizar";
      await Deal.updateOne({ _id: payload.dealId, orgId }, { stage: data.stage ?? payload.stage });
      return "Etapa da oportunidade atualizada";
    }
    default:
      return "Acao ignorada";
  }
};

const executeWorkflow = async (params: {
  orgId: string;
  workflow: any;
  triggerType: WorkflowTriggerType;
  payload: Record<string, any>;
  initiatedBy?: { userId: string; role: Role };
}) => {
  const { orgId, workflow, triggerType, payload, initiatedBy } = params;
  const conditions = (workflow.conditions ?? []) as WorkflowCondition[];
  const passed = conditions.every((condition) => evaluateCondition(payload, condition));
  if (!passed) {
    const run = await WorkflowRun.create({
      orgId,
      workflowId: workflow._id,
      status: "SKIPPED",
      triggerEvent: JSON.stringify({ triggerType, payload }),
      result: "Condicoes nao atendidas",
      executedAt: new Date(),
    });
    await emitEvent({
      orgId,
      type: "workflow.run",
      payload: {
        workflowId: workflow._id.toString(),
        runId: run._id.toString(),
        status: "SKIPPED",
        triggerType,
      },
    });
    return;
  }

  try {
    const results: string[] = [];
    for (const action of workflow.actions as WorkflowAction[]) {
      // eslint-disable-next-line no-await-in-loop
      const result = await runAction({ orgId, action, payload });
      results.push(result);
    }

    const run = await WorkflowRun.create({
      orgId,
      workflowId: workflow._id,
      status: "SUCCESS",
      triggerEvent: JSON.stringify({ triggerType, payload }),
      result: results.join(" | "),
      executedAt: new Date(),
    });
    await emitEvent({
      orgId,
      type: "workflow.run",
      payload: {
        workflowId: workflow._id.toString(),
        runId: run._id.toString(),
        status: "SUCCESS",
        triggerType,
      },
    });

    await createSystemAudit({
      orgId,
      entity: "workflow-run",
      entityId: workflow._id.toString(),
      summary: `Fluxo ${workflow.name} executado`,
      initiatedBy,
    });
  } catch (error) {
    const run = await WorkflowRun.create({
      orgId,
      workflowId: workflow._id,
      status: "FAILED",
      triggerEvent: JSON.stringify({ triggerType, payload }),
      error: error instanceof Error ? error.message : "Erro desconhecido",
      executedAt: new Date(),
    });
    await emitEvent({
      orgId,
      type: "workflow.run",
      payload: {
        workflowId: workflow._id.toString(),
        runId: run._id.toString(),
        status: "FAILED",
        triggerType,
      },
    });

    await createSystemAudit({
      orgId,
      entity: "workflow-run",
      entityId: workflow._id.toString(),
      summary: `Fluxo ${workflow.name} falhou`,
      initiatedBy,
    });
  }
};

export const triggerAutomation = async (params: {
  orgId: string;
  triggerType: WorkflowTriggerType;
  payload: Record<string, any>;
  initiatedBy?: { userId: string; role: Role };
}) => {
  const { orgId, triggerType, payload, initiatedBy } = params;
  const workflows = await Workflow.find({
    orgId,
    enabled: true,
    "trigger.type": triggerType,
  }).lean();

  await Promise.all(
    workflows.map((workflow) => executeWorkflow({ orgId, workflow, triggerType, payload, initiatedBy })),
  );
};

export const runWorkflowOnce = async (params: {
  orgId: string;
  workflowId: string;
  triggerType: WorkflowTriggerType;
  payload: Record<string, any>;
  initiatedBy?: { userId: string; role: Role };
}) => {
  const workflow = await Workflow.findOne({ _id: params.workflowId, orgId: params.orgId }).lean();
  if (!workflow) return;
  await executeWorkflow({
    orgId: params.orgId,
    workflow,
    triggerType: params.triggerType,
    payload: params.payload,
    initiatedBy: params.initiatedBy,
  });
};