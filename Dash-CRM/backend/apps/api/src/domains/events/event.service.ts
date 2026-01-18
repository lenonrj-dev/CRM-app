import { Event } from "./event.model";

export const emitEvent = async (params: {
  orgId: string;
  type: string;
  payload: Record<string, unknown>;
  delayMs?: number;
}) => {
  const { orgId, type, payload, delayMs = 0 } = params;
  const nextRunAt = new Date(Date.now() + delayMs);
  return Event.create({
    orgId,
    type,
    payload,
    status: "PENDING",
    attempts: 0,
    nextRunAt,
  });
};
