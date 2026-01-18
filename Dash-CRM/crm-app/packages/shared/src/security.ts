export type PasswordPolicyDTO = {
  minLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
};

export type SecurityPolicyDTO = {
  orgId: string;
  password: PasswordPolicyDTO;
  sessionTtlDays: number;
  requireTwoFactor: boolean;
  allowedOrigins?: string[];
  updatedAt: string;
};

export type SessionDTO = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
};

export type TwoFactorStatusDTO = {
  enabled: boolean;
  verifiedAt?: string;
  backupCodesRemaining?: number;
};

export type TwoFactorSetupDTO = {
  qrCodeDataUrl: string;
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
};
