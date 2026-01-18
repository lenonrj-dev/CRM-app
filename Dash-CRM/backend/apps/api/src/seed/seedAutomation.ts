import { Workflow } from "../domains/automation/workflow.model";
import { WorkflowRun } from "../domains/automation/workflowRun.model";
import { Notification } from "../domains/notifications/notification.model";
import { WebhookSubscription } from "../domains/integrations/webhook.model";
import { Event } from "../domains/events/event.model";
import { workflowTemplates } from "../domains/automation/workflow.templates";
import type { SeedContext } from "./seedTypes";

const buildTriggerEvent = (triggerType: string, payload: Record<string, any>) =>
  JSON.stringify({ triggerType, payload });

export const seedAutomation = async (ctx: SeedContext) => {
  const workflows = await Workflow.create(
    workflowTemplates.map((template, index) => ({
      orgId: ctx.org._id,
      name: template.name,
      description: template.description,
      enabled: index < 4,
      trigger: template.trigger,
      conditions: template.conditions,
      actions: template.actions,
      createdBy: ctx.users.admin._id,
    })),
  );

  const runs = await WorkflowRun.create([
    {
      orgId: ctx.org._id,
      workflowId: workflows[0]._id,
      status: "SUCCESS",
      triggerEvent: buildTriggerEvent("LEAD_CREATED", {
        companyId: ctx.companies[0]._id.toString(),
        contactId: ctx.contacts[0]._id.toString(),
      }),
      result: "Atividade criada | Notificação enviada",
      executedAt: new Date(),
    },
    {
      orgId: ctx.org._id,
      workflowId: workflows[1]._id,
      status: "SUCCESS",
      triggerEvent: buildTriggerEvent("DEAL_STAGE_CHANGED", {
        dealId: ctx.deals[1]._id.toString(),
        stage: "PROPOSAL",
      }),
      result: "Acompanhamento agendado",
      executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      orgId: ctx.org._id,
      workflowId: workflows[2]._id,
      status: "FAILED",
      triggerEvent: buildTriggerEvent("TICKET_CREATED", {
        ticketId: ctx.tickets[1]._id.toString(),
        priority: "URGENT",
      }),
      error: "Responsável não encontrado",
      executedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ]);

  const notifications = await Notification.create([
    {
      orgId: ctx.org._id,
      userId: ctx.users.admin._id,
      title: "Renovação próxima",
      message: "Contrato da Lumen Health termina em 15 dias.",
      entity: "contract",
      entityId: ctx.companies[2]._id.toString(),
    },
    {
      orgId: ctx.org._id,
      userId: ctx.users.manager._id,
      title: "Alerta de pontuação de saúde",
      message: "A pontuação de saúde da Lumen Health caiu abaixo de 60.",
      entity: "company",
      entityId: ctx.companies[2]._id.toString(),
    },
    {
      orgId: ctx.org._id,
      userId: ctx.users.user._id,
      title: "Novo potencial atribuído",
      message: "Faça acompanhamento com o potencial da Nuvora Labs hoje.",
      entity: "contact",
      entityId: ctx.contacts[0]._id.toString(),
    },
  ]);

  const webhooks = await WebhookSubscription.create([
    {
      orgId: ctx.org._id,
      eventType: "deal.updated",
      url: "https://example.com/webhooks/ateliux",
      secret: "demo-secret",
      enabled: false,
    },
  ]);

  const events = await Event.create([
    {
      orgId: ctx.org._id,
      type: "lead.created",
      payload: {
        contactId: ctx.contacts[0]._id.toString(),
        companyId: ctx.companies[0]._id.toString(),
      },
      status: "SUCCESS",
      attempts: 1,
      nextRunAt: new Date(),
    },
    {
      orgId: ctx.org._id,
      type: "workflow.run",
      payload: { workflowId: workflows[0]._id.toString(), status: "SUCCESS" },
      status: "SUCCESS",
      attempts: 1,
      nextRunAt: new Date(),
    },
  ]);

  return { workflows, runs, notifications, webhooks, events };
};
