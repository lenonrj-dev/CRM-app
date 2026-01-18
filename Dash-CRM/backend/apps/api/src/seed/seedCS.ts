import { CustomerSuccessProfile } from "../domains/cs/csProfile.model";
import { Contract } from "../domains/cs/contract.model";
import { calculateHealthScore } from "../domains/cs/health.service";
import type { SeedContext } from "./seedTypes";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export const seedCustomerSuccess = async (ctx: SeedContext) => {
  const lifecycleStages = ["ONBOARDING", "ACTIVE", "AT_RISK"];

  const profiles = await Promise.all(
    ctx.companies.map(async (company, index) => {
      const { score, breakdown } = await calculateHealthScore({
        orgId: ctx.org._id.toString(),
        companyId: company._id.toString(),
      });

      const adjusted =
        index === 2
          ? {
              score: Math.max(45, score - 20),
              breakdown: [
                ...breakdown,
                { label: "Risco de renovação", score: -15, notes: "QBR em atraso" },
              ],
            }
          : { score, breakdown };

      return CustomerSuccessProfile.create({
        orgId: ctx.org._id,
        companyId: company._id,
        lifecycleStage: lifecycleStages[index % lifecycleStages.length],
        healthScore: adjusted.score,
        healthBreakdown: adjusted.breakdown,
        ownerId: ctx.users.manager._id,
        onboardingChecklist: [
          { title: "Reunião de abertura", status: "DONE", dueDate: daysAgo(20) },
          { title: "Importação de dados", status: "PENDING", dueDate: daysFromNow(5) },
          {
            title: "Treinamento da equipe",
            status: index === 0 ? "PENDING" : "DONE",
            dueDate: daysFromNow(12),
          },
        ],
      });
    }),
  );

  const contracts = await Contract.create([
    {
      orgId: ctx.org._id,
      companyId: ctx.companies[0]._id,
      startAt: daysAgo(300),
      endAt: daysFromNow(30),
      value: 9500,
      status: "ACTIVE",
      renewalStatus: "UPCOMING",
      ownerId: ctx.users.manager._id,
    },
    {
      orgId: ctx.org._id,
      companyId: ctx.companies[1]._id,
      startAt: daysAgo(180),
      endAt: daysFromNow(60),
      value: 14000,
      status: "ACTIVE",
      renewalStatus: "IN_NEGOTIATION",
      ownerId: ctx.users.admin._id,
    },
    {
      orgId: ctx.org._id,
      companyId: ctx.companies[2]._id,
      startAt: daysAgo(360),
      endAt: daysFromNow(15),
      value: 8000,
      status: "ACTIVE",
      renewalStatus: "UPCOMING",
      ownerId: ctx.users.manager._id,
    },
  ]);

  return { profiles, contracts };
};
