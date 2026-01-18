import { resetDatabase } from "./seedReset";
import { seedCore } from "./seedCore";
import { seedMarketing } from "./seedMarketing";
import { seedCustomerSuccess } from "./seedCS";
import { seedSales } from "./seedSales";
import { seedAutomation } from "./seedAutomation";

export const seedDatabase = async () => {
  await resetDatabase();

  const core = await seedCore();
  await seedMarketing(core);
  await seedCustomerSuccess(core);
  await seedSales(core);
  await seedAutomation(core);
};
