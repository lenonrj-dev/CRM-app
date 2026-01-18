import { Activity } from "../crm/activity.model";
import { Deal } from "../crm/deal.model";
import { Ticket } from "../support/ticket.model";
import type { ScoreBreakdownItem } from "@ateliux/shared";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const calculateHealthScore = async (params: { orgId: string; companyId: string }) => {
  const { orgId, companyId } = params;
  const breakdown: ScoreBreakdownItem[] = [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

  const [recentActivities, openTickets, urgentTickets, activeDeals] = await Promise.all([
    Activity.countDocuments({ orgId, companyId, createdAt: { $gte: thirtyDaysAgo } }),
    Ticket.countDocuments({ orgId, companyId, status: { $in: ["OPEN", "PENDING"] } }),
    Ticket.countDocuments({
      orgId,
      companyId,
      status: { $in: ["OPEN", "PENDING"] },
      priority: { $in: ["HIGH", "URGENT"] },
    }),
    Deal.countDocuments({ orgId, companyId, stage: { $nin: ["LOST"] } }),
  ]);

  let score = 60;

  if (recentActivities > 0) {
    score += 10;
    breakdown.push({ label: "Atividades recentes", score: 10, notes: `${recentActivities} atividades` });
  } else {
    score -= 10;
    breakdown.push({ label: "Sem atividades recentes", score: -10 });
  }

  if (activeDeals > 0) {
    score += 10;
    breakdown.push({ label: "Oportunidades ativas", score: 10, notes: `${activeDeals} oportunidades` });
  }

  if (openTickets > 3) {
    score -= 10;
    breakdown.push({ label: "Volume de chamados", score: -10, notes: `${openTickets} em aberto` });
  }

  if (urgentTickets > 0) {
    score -= 15;
    breakdown.push({ label: "Chamados urgentes", score: -15, notes: `${urgentTickets} alta prioridade` });
  }

  const lastActivity = await Activity.findOne({ orgId, companyId }).sort({ createdAt: -1 }).lean();
  if (lastActivity && lastActivity.createdAt < fortyFiveDaysAgo) {
    score -= 10;
    breakdown.push({ label: "Baixo engajamento", score: -10 });
  }

  return {
    score: clamp(score),
    breakdown,
  };
};
