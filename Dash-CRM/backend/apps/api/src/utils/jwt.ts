import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "@ateliux/shared";

export type TokenPayload = {
  sub: string;
  role: Role;
  orgId: string;
};

const accessSecret = env.jwtAccessSecret as Secret;
const refreshSecret = env.jwtRefreshSecret as Secret;
const accessExpiresIn = env.jwtAccessTtl as SignOptions["expiresIn"];
const refreshExpiresIn = env.jwtRefreshTtl as SignOptions["expiresIn"];

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, accessSecret) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, refreshSecret) as TokenPayload;