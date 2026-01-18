import { env } from "./config/env";
import { connectDb } from "./config/db";
import { Organization } from "./domains/auth/organization.model";
import { seedDatabase } from "./seed/seedData";
import { startAutomationScheduler } from "./domains/automation/scheduler";
import { startEventWorker } from "./domains/events/event.worker";
import { createApp } from "./app";

const app = createApp();

const start = async () => {
  await connectDb();
  const hasOrg = await Organization.exists({});
  if (!hasOrg) {
    await seedDatabase();
    // eslint-disable-next-line no-console
    console.log("Base de dados populada com dados de demo");
  }
  startAutomationScheduler();
  if (env.eventWorkerEnabled) {
    startEventWorker();
  }
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API em execucao em http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Falha ao iniciar a API", error);
  process.exit(1);
});