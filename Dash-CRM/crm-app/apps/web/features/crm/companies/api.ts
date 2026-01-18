import type {
  ActivityDTO,
  CompanyDTO,
  ContactDTO,
  DealDTO,
  TicketDTO,
  TimelineEvent,
  CustomerSuccessProfileDTO,
  ContractDTO,
} from "@ateliux/shared";
import { apiFetch } from "../../../lib/api";

type CompanyOverview = {
  company: CompanyDTO;
  contacts: ContactDTO[];
  deals: DealDTO[];
  activities: ActivityDTO[];
  tickets: TicketDTO[];
  timeline: TimelineEvent[];
  csProfile: CustomerSuccessProfileDTO | null;
  contracts: ContractDTO[];
};

export const listCompanies = () => apiFetch<{ items: CompanyDTO[] }>("/companies");

export const createCompany = (payload: Partial<CompanyDTO>) =>
  apiFetch<{ company: CompanyDTO }>("/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateCompany = (id: string, payload: Partial<CompanyDTO>) =>
  apiFetch<{ company: CompanyDTO }>(`/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteCompany = (id: string) =>
  apiFetch<{ ok: boolean }>(`/companies/${id}`, { method: "DELETE" });

export const getCompanyOverview = (id: string) => apiFetch<CompanyOverview>(`/companies/${id}/overview`);
