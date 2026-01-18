import dotenv from "dotenv";

dotenv.config();

const getNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: getNumber(process.env.PORT, 4000),
  mongoUrl: process.env.MONGO_URL ?? "mongodb://localhost:27017/ateliux_crm",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? "change_me_access",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "change_me_refresh",
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "30m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "30m",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  eventWorkerEnabled: process.env.EVENT_WORKER_ENABLED !== "false",
};
