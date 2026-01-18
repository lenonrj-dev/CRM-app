import mongoose from "mongoose";
import { env } from "./env";

let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    mongoose.set("strictQuery", true);
    connectionPromise = mongoose.connect(env.mongoUrl);
  }
  await connectionPromise;
};