import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "@ateliux/shared";

export type TokenPayload = {
  sub: string;
  role: Role;
  orgId: string;
};

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtAccessSecret) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
