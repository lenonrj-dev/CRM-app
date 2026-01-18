import type { WorkflowDTO, WorkflowTrigger } from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

export type WorkflowTemplateDTO = {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
};

export const listWorkflows = () => apiFetch<{ items: WorkflowDTO[] }>("/automation/workflows");

export const getWorkflow = (id: string) => apiFetch<{ workflow: WorkflowDTO }>(`/automation/workflows/${id}`);

export const createWorkflow = (payload: Partial<WorkflowDTO>) =>
  apiFetch<{ workflow: WorkflowDTO }>("/automation/workflows", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateWorkflow = (id: string, payload: Partial<WorkflowDTO>) =>
  apiFetch<{ workflow: WorkflowDTO }>(`/automation/workflows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteWorkflow = (id: string) =>
  apiFetch<{ ok: boolean }>(`/automation/workflows/${id}`, { method: "DELETE" });

export const toggleWorkflow = (id: string) =>
  apiFetch<{ workflow: WorkflowDTO }>(`/automation/workflows/${id}/toggle`, { method: "POST" });

export const listWorkflowTemplates = () => apiFetch<{ items: WorkflowTemplateDTO[] }>("/automation/workflows/library");

export const installWorkflowTemplate = (templateId: string) =>
  apiFetch<{ workflow: WorkflowDTO }>(`/automation/workflows/library/${templateId}/install`, { method: "POST" });
