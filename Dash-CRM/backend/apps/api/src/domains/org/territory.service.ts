import { Territory } from "./territory.model";

type TerritoryCandidate = {
  industry?: string;
  size?: string;
  region?: string;
};

const matches = (rules: any, candidate: TerritoryCandidate) => {
  if (rules?.regions?.length && (!candidate.region || !rules.regions.includes(candidate.region))) {
    return false;
  }
  if (rules?.industries?.length && (!candidate.industry || !rules.industries.includes(candidate.industry))) {
    return false;
  }
  if (rules?.sizes?.length && (!candidate.size || !rules.sizes.includes(candidate.size))) {
    return false;
  }
  return true;
};

export const matchTerritory = async (orgId: string, candidate: TerritoryCandidate) => {
  const territories = await Territory.find({ orgId }).lean();
  return territories.find((territory) => matches(territory.rules, candidate)) ?? null;
};
