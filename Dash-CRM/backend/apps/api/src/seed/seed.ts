import { connectDb } from "../config/db";
import { seedDatabase } from "./seedData";

const run = async () => {
  await connectDb();
  await seedDatabase();
  // eslint-disable-next-line no-console
  console.log("Seed concluído");
  process.exit(0);
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Falha ao executar o seed", error);
  process.exit(1);
});
