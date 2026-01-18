import type { ScoreBreakdownItem } from "./marketing";

export const lifecycleStageValues = ["ONBOARDING", "ACTIVE", "AT_RISK", "CHURNED"] as const;
export type LifecycleStage = typeof lifecycleStageValues[number];

export const onboardingItemStatusValues = ["PENDING", "DONE", "BLOCKED"] as const;
export type OnboardingItemStatus = typeof onboardingItemStatusValues[number];

export type OnboardingItemDTO = {
  id: string;
  title: string;
  status: OnboardingItemStatus;
  dueDate?: string;
};

export type CustomerSuccessProfileDTO = {
  id: string;
  orgId: string;
  companyId: string;
  lifecycleStage: LifecycleStage;
  healthScore: number;
  healthBreakdown: ScoreBreakdownItem[];
  ownerId?: string;
  onboardingChecklist: OnboardingItemDTO[];
  createdAt: string;
  updatedAt: string;
};

export const contractStatusValues = ["ACTIVE", "PAUSED", "CANCELED", "EXPIRED"] as const;
export type ContractStatus = typeof contractStatusValues[number];

export const renewalStatusValues = ["UPCOMING", "IN_NEGOTIATION", "RENEWED", "LOST"] as const;
export type RenewalStatus = typeof renewalStatusValues[number];

export type ContractDTO = {
  id: string;
  orgId: string;
  companyId: string;
  startAt: string;
  endAt: string;
  value: number;
  status: ContractStatus;
  renewalStatus: RenewalStatus;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
};
