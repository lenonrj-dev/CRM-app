export type BiPoint = {
  label: string;
  value: number;
};

export type BiRevenueRow = {
  month: string;
  revenue: number;
  channel?: string;
};

export type BiPipelineRow = {
  stage: string;
  total: number;
  count: number;
};

export type BiSupportRow = {
  status: string;
  count: number;
};

export type BiCsRow = {
  lifecycleStage: string;
  count: number;
  avgHealthScore: number;
};
