export const createdFromValues = ["form", "web", "manual", "import"] as const;
export type CreatedFrom = typeof createdFromValues[number];

export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export type AttributionTouch = {
  utm?: UtmParams;
  landingPage?: string;
  referrer?: string;
  createdFrom?: CreatedFrom;
  timestamp: string;
};

export type AttributionDTO = {
  firstTouch?: AttributionTouch;
  lastTouch?: AttributionTouch;
};

export type ScoreBreakdownItem = {
  label: string;
  score: number;
  notes?: string;
};

export type LeadScoreDTO = {
  scoreTotal: number;
  fitScore: number;
  intentScore: number;
  breakdown: ScoreBreakdownItem[];
  updatedAt?: string;
};

export const campaignStatusValues = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED"] as const;
export type CampaignStatus = typeof campaignStatusValues[number];

export type CampaignDTO = {
  id: string;
  orgId: string;
  name: string;
  channel: string;
  budget?: number;
  startAt?: string;
  endAt?: string;
  status: CampaignStatus;
  utm?: UtmParams;
  createdAt: string;
  updatedAt: string;
};

export type AttributionRowDTO = {
  source?: string;
  medium?: string;
  campaign?: string;
  leads: number;
  deals: number;
  revenue: number;
};
