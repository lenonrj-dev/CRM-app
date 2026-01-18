import { connectDb } from "./config/db";
import { startEventWorker } from "./domains/events/event.worker";
import { env } from "./config/env";

const start = async () => {
  await connectDb();
  startEventWorker();
  // eslint-disable-next-line no-console
  console.log("Worker de eventos em execução");
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Falha ao iniciar o worker", error);
  process.exit(1);
});
