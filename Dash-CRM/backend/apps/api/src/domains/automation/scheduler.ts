import cron from "node-cron";
import { CustomerSuccessProfile } from "../cs/csProfile.model";
import { Contract } from "../cs/contract.model";
import { calculateHealthScore } from "../cs/health.service";
import { emitEvent } from "../events/event.service";

const getNoticeDays = () => {
  const value = Number(process.env.RENEWAL_NOTICE_DAYS ?? 30);
  return Number.isNaN(value) ? 30 : value;
};

export const runRenewalJob = async () => {
  const days = getNoticeDays();
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);

  const contracts = await Contract.find({ endAt: { $gte: start, $lte: end } }).lean();
  await Promise.all(
    contracts.map((contract) =>
      emitEvent({
        orgId: contract.orgId.toString(),
        type: "renewal.due_soon",
        payload: {
          companyId: contract.companyId.toString(),
          contractId: contract._id.toString(),
          endAt: contract.endAt.toISOString(),
          value: contract.value,
        },
      }),
    ),
  );
};

export const runHealthJob = async () => {
  const profiles = await CustomerSuccessProfile.find({}).lean();
  await Promise.all(
    profiles.map(async (profile) => {
      const { score, breakdown } = await calculateHealthScore({
        orgId: profile.orgId.toString(),
        companyId: profile.companyId.toString(),
      });

      await CustomerSuccessProfile.updateOne(
        { _id: profile._id },
        { healthScore: score, healthBreakdown: breakdown },
      );

      if (profile.healthScore >= 60 && score < 60) {
        await emitEvent({
          orgId: profile.orgId.toString(),
          type: "health.score_dropped",
          payload: { companyId: profile.companyId.toString(), score },
        });
      }
    }),
  );
};

export const startAutomationScheduler = () => {
  cron.schedule("0 3 * * *", () => {
    runRenewalJob().catch(() => undefined);
    runHealthJob().catch(() => undefined);
  });
};
