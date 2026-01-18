import type { UserMembershipDTO } from "@ateliux/shared";

export const toOrganizationDto = (org: any) => ({
  id: org._id.toString(),
  name: org.name,
  slug: org.slug,
  plan: org.plan,
  currency: org.currency,
  timezone: org.timezone,
  onboardingCompleted: org.onboardingCompleted,
  createdAt: org.createdAt.toISOString(),
  updatedAt: org.updatedAt.toISOString(),
});

const toMembershipDto = (membership: any): UserMembershipDTO => ({
  id: membership._id.toString(),
  userId: membership.userId.toString(),
  orgId: membership.orgId.toString(),
  unitId: membership.unitId?.toString(),
  teamIds: membership.teamIds?.map((id: any) => id.toString()) ?? [],
  role: membership.role,
  scope: membership.scope,
  status: membership.status,
  createdAt: membership.createdAt.toISOString(),
  updatedAt: membership.updatedAt.toISOString(),
});

export const toUserDto = (user: any, org: any, memberships: any[] = []) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  orgId: org._id.toString(),
  organization: toOrganizationDto(org),
  twoFactorEnabled: user.twoFactorEnabled ?? false,
  memberships: memberships.map(toMembershipDto),
  emailVerified: user.emailVerified ?? false,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
});
