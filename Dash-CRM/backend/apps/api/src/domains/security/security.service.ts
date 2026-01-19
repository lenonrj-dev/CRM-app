import { env } from "../../config/env";
import { SecurityPolicy } from "./securityPolicy.model";

const parseOrigins = (value: string) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const defaultSecurityPolicy = {
  password: {
    minLength: 8,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSpecial: false,
  },
  sessionTtlDays: 30,
  requireTwoFactor: false,
  allowedOrigins: parseOrigins(env.corsOrigin),
};

export const getSecurityPolicy = async (orgId: string) => {
  const existing = await SecurityPolicy.findOne({ orgId });
  if (existing) return existing;
  return SecurityPolicy.create({ orgId, ...defaultSecurityPolicy });
};

export const validatePassword = (
  password: string,
  policy: typeof defaultSecurityPolicy.password,
) => {
  const errors: string[] = [];
  if (password.length < policy.minLength) errors.push("minLength");
  if (policy.requireUpper && !/[A-Z]/.test(password)) errors.push("requireUpper");
  if (policy.requireLower && !/[a-z]/.test(password)) errors.push("requireLower");
  if (policy.requireNumber && !/[0-9]/.test(password)) errors.push("requireNumber");
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) errors.push("requireSpecial");
  return { ok: errors.length === 0, errors };
};