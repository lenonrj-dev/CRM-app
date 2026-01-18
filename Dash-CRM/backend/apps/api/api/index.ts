import { createApp } from "../src/app";
import { connectDb } from "../src/config/db";

const app = createApp();

export default async function handler(req: any, res: any) {
  await connectDb();
  return app(req, res);
}
