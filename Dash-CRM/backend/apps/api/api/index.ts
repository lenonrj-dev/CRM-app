import { createApp } from "../src/app";
import { connectDb } from "../src/config/db";

const app = createApp();

export default async function handler(req: any, res: any) {
  try {
    await connectDb();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao conectar ao banco";
    return res.status(500).json({ ok: false, message, code: "DB_CONNECTION_ERROR" });
  }
  if (req.url && req.url.startsWith("/api")) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return app(req, res);
}
