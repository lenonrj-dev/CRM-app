import type { WorkflowRunDTO } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export const listRuns = () => apiFetch<{ items: WorkflowRunDTO[] }>("/automation/runs");

export const testRun = (workflowId: string, payload?: Record<string, unknown>) =>
  apiFetch<{ ok: boolean }>(`/automation/test-run/${workflowId}`, {
    method: "POST",
    body: JSON.stringify({ payload }),
  });
