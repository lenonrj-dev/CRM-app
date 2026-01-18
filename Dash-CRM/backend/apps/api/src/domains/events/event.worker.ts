import { Event } from "./event.model";
import { triggerAutomation } from "../automation/automation.service";
import { dispatchWebhooks } from "../integrations/webhook.service";
import { invalidateCache } from "../../utils/cache";

const MAX_ATTEMPTS = 5;

const backoffMs = (attempts: number) => {
  const minutes = Math.min(60, Math.pow(2, attempts));
  return minutes * 60 * 1000;
};

const handleEvent = async (event: any) => {
  switch (event.type) {
    case "lead.created": {
      await triggerAutomation({
        orgId: event.orgId.toString(),
        triggerType: "LEAD_CREATED",
        payload: event.payload ?? {},
        initiatedBy: event.payload?.initiatedBy,
      });
      break;
    }
    case "deal.updated": {
      if (event.payload?.stageChanged) {
        await triggerAutomation({
          orgId: event.orgId.toString(),
          triggerType: "DEAL_STAGE_CHANGED",
          payload: event.payload ?? {},
          initiatedBy: event.payload?.initiatedBy,
        });
      }
      break;
    }
    case "deal.stage_changed": {
      await triggerAutomation({
        orgId: event.orgId.toString(),
        triggerType: "DEAL_STAGE_CHANGED",
        payload: event.payload ?? {},
        initiatedBy: event.payload?.initiatedBy,
      });
      break;
    }
    case "ticket.created": {
      await triggerAutomation({
        orgId: event.orgId.toString(),
        triggerType: "TICKET_CREATED",
        payload: event.payload ?? {},
        initiatedBy: event.payload?.initiatedBy,
      });
      break;
    }
    case "health.score_dropped": {
      await triggerAutomation({
        orgId: event.orgId.toString(),
        triggerType: "HEALTH_SCORE_DROPPED",
        payload: event.payload ?? {},
        initiatedBy: event.payload?.initiatedBy,
      });
      break;
    }
    case "renewal.due_soon": {
      await triggerAutomation({
        orgId: event.orgId.toString(),
        triggerType: "RENEWAL_DUE_SOON",
        payload: event.payload ?? {},
        initiatedBy: event.payload?.initiatedBy,
      });
      break;
    }
    default:
      break;
  }

  await dispatchWebhooks({
    orgId: event.orgId.toString(),
    id: event._id.toString(),
    type: event.type,
    createdAt: event.createdAt,
    payload: event.payload ?? {},
  });
};

export const processNextEvent = async () => {
  const now = new Date();
  const event = await Event.findOneAndUpdate(
    { status: "PENDING", nextRunAt: { $lte: now } },
    { status: "PROCESSING" },
    { sort: { nextRunAt: 1 }, new: true },
  );

  if (!event) return false;

  try {
    await handleEvent(event);
    invalidateCache("bi:");
    event.status = "SUCCESS";
    event.lastError = undefined;
  } catch (error) {
    event.attempts += 1;
    event.lastError = error instanceof Error ? error.message : "Erro desconhecido";
    if (event.attempts >= MAX_ATTEMPTS) {
      event.status = "FAILED";
    } else {
      event.status = "PENDING";
      event.nextRunAt = new Date(Date.now() + backoffMs(event.attempts));
    }
  }

  await event.save();
  return true;
};

export const startEventWorker = () => {
  const interval = setInterval(() => {
    processNextEvent().catch(() => undefined);
  }, 2000);

  return () => clearInterval(interval);
};
