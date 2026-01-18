import type { CompanyDTO, ContactDTO, DealDTO, LeadScoreDTO, ScoreBreakdownItem } from "@ateliux/shared";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const addBreakdown = (items: ScoreBreakdownItem[], label: string, score: number, notes?: string) => {
  items.push({ label, score, notes });
};

const parseCompanySize = (size?: string) => {
  if (!size) return undefined;
  const match = size.match(/\d+/g);
  if (!match) return undefined;
  const numbers = match.map(Number).filter((value) => !Number.isNaN(value));
  return numbers.length ? Math.max(...numbers) : undefined;
};

export const calculateContactScore = (params: {
  contact: ContactDTO;
  company?: CompanyDTO | null;
  hasOpenHighTickets?: boolean;
  hasRecentDeal?: boolean;
}): LeadScoreDTO => {
  const { contact, company, hasOpenHighTickets, hasRecentDeal } = params;
  const breakdown: ScoreBreakdownItem[] = [];

  let fitScore = 0;
  const title = contact.title?.toLowerCase() ?? "";
  if (["head", "manager", "director", "vp", "chief", "cfo", "ceo"].some((token) => title.includes(token))) {
    fitScore += 25;
    addBreakdown(breakdown, "Cargo sênior", 25, contact.title);
  }

  const sizeValue = parseCompanySize(company?.size);
  if (sizeValue && sizeValue >= 100) {
    fitScore += 20;
    addBreakdown(breakdown, "Tamanho da empresa", 20, company?.size);
  }

  if (company?.industry) {
    fitScore += 10;
    addBreakdown(breakdown, "Segmento informado", 10, company.industry);
  }

  if (contact.email) {
    fitScore += 5;
    addBreakdown(breakdown, "E-mail informado", 5);
  }

  if (contact.phone) {
    fitScore += 5;
    addBreakdown(breakdown, "Telefone informado", 5);
  }

  let intentScore = 0;
  if (contact.attribution?.lastTouch?.utm?.source) {
    intentScore += 15;
    addBreakdown(breakdown, "Origem UTM", 15, contact.attribution.lastTouch.utm.source);
  }

  if (contact.createdFrom === "web" || contact.createdFrom === "form") {
    intentScore += 10;
    const createdFromLabel =
      contact.createdFrom === "form"
        ? "formulário"
        : contact.createdFrom === "web"
          ? "web"
          : contact.createdFrom === "manual"
            ? "manual"
            : contact.createdFrom === "import"
              ? "importação"
              : contact.createdFrom;
    addBreakdown(breakdown, "Origem do cadastro", 10, createdFromLabel);
  }

  if (hasRecentDeal) {
    intentScore += 20;
    addBreakdown(breakdown, "Oportunidade recente", 20);
  }

  if (hasOpenHighTickets) {
    intentScore -= 10;
    addBreakdown(breakdown, "Chamados de alta prioridade", -10);
  }

  const scoreTotal = clamp(fitScore + intentScore);

  return {
    scoreTotal,
    fitScore: clamp(fitScore),
    intentScore: clamp(intentScore),
    breakdown,
    updatedAt: new Date().toISOString(),
  };
};

export const calculateDealScore = (deal: DealDTO): LeadScoreDTO => {
  const breakdown: ScoreBreakdownItem[] = [];
  const stageScores: Record<string, number> = {
    NEW: 10,
    QUALIFIED: 30,
    PROPOSAL: 50,
    NEGOTIATION: 70,
    WON: 90,
    LOST: 0,
  };
  const stageScore = stageScores[deal.stage] ?? 0;
  addBreakdown(breakdown, "Etapa", stageScore, deal.stage);

  let fitScore = stageScore;
  let intentScore = 0;

  if (deal.value >= 100000) {
    intentScore += 10;
    addBreakdown(breakdown, "Valor da oportunidade", 10, "100 mil+");
  } else if (deal.value >= 50000) {
    intentScore += 5;
    addBreakdown(breakdown, "Valor da oportunidade", 5, "50 mil+");
  }

  if (deal.attribution?.lastTouch?.utm?.source) {
    intentScore += 5;
    addBreakdown(breakdown, "UTM presente", 5, deal.attribution.lastTouch.utm.source);
  }

  if (deal.contactId) {
    intentScore += 5;
    addBreakdown(breakdown, "Contato vinculado", 5);
  }

  const scoreTotal = clamp(fitScore + intentScore);

  return {
    scoreTotal,
    fitScore: clamp(fitScore),
    intentScore: clamp(intentScore),
    breakdown,
    updatedAt: new Date().toISOString(),
  };
};

export type TouchInput = {
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  landingPage?: string;
  referrer?: string;
  createdFrom?: string;
  timestamp?: string;
};

export const applyTouch = (current: any, touch: TouchInput) => {
  const timestamp = touch.timestamp ? new Date(touch.timestamp) : new Date();
  const nextTouch = {
    utm: touch.utm ?? {},
    landingPage: touch.landingPage,
    referrer: touch.referrer,
    createdFrom: touch.createdFrom,
    timestamp,
  };

  const firstTouch = current?.firstTouch ?? nextTouch;

  return {
    firstTouch,
    lastTouch: nextTouch,
  };
};
