import type { AttributionDTO, CreatedFrom, LeadScoreDTO } from "./marketing";
import type { UserMembershipDTO, VisibilityScope } from "./org";

export const dealStageValues = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type DealStage = typeof dealStageValues[number];

export const activityTypeValues = ["TASK", "CALL", "MEETING", "NOTE"] as const;
export type ActivityType = typeof activityTypeValues[number];

export const ticketStatusValues = ["OPEN", "PENDING", "RESOLVED", "CLOSED"] as const;
export type TicketStatus = typeof ticketStatusValues[number];

export const ticketPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TicketPriority = typeof ticketPriorityValues[number];

export type OrganizationDTO = {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  currency?: string;
  timezone?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: import("./permissions").Role;
  orgId: string;
  organization?: OrganizationDTO;
  twoFactorEnabled?: boolean;
  memberships?: UserMembershipDTO[];
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
};

export type CompanyDTO = {
  id: string;
  orgId: string;
  name: string;
  industry?: string;
  website?: string;
  size?: string;
  region?: string;
  ownerId?: string;
  unitId?: string;
  teamId?: string;
  visibilityScope?: VisibilityScope;
  tags?: string[];
  createdFrom?: CreatedFrom;
  attribution?: AttributionDTO;
  createdAt: string;
  updatedAt: string;
};

export type ContactDTO = {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string;
  ownerId?: string;
  unitId?: string;
  teamId?: string;
  visibilityScope?: VisibilityScope;
  createdFrom?: CreatedFrom;
  attribution?: AttributionDTO;
  leadScore?: LeadScoreDTO;
  createdAt: string;
  updatedAt: string;
};

export type DealDTO = {
  id: string;
  orgId: string;
  name: string;
  stage: DealStage;
  value: number;
  expectedCloseDate?: string;
  ownerId?: string;
  companyId?: string;
  contactId?: string;
  unitId?: string;
  teamId?: string;
  visibilityScope?: VisibilityScope;
  lostReason?: string;
  createdFrom?: CreatedFrom;
  attribution?: AttributionDTO;
  leadScore?: LeadScoreDTO;
  createdAt: string;
  updatedAt: string;
};

export type ActivityDTO = {
  id: string;
  orgId: string;
  type: ActivityType;
  subject: string;
  dueDate?: string;
  completed: boolean;
  notes?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  ownerId?: string;
  unitId?: string;
  teamId?: string;
  visibilityScope?: VisibilityScope;
  createdAt: string;
  updatedAt: string;
};

export type TicketCommentDTO = {
  id: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
};

export type TicketDTO = {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy?: string;
  companyId?: string;
  contactId?: string;
  assignedTo?: string;
  unitId?: string;
  teamId?: string;
  visibilityScope?: VisibilityScope;
  comments?: TicketCommentDTO[];
  createdAt: string;
  updatedAt: string;
};

export type TimelineEvent =
  | {
      id: string;
      type: "activity";
      occurredAt: string;
      title: string;
      description?: string;
      refId?: string;
    }
  | {
      id: string;
      type: "ticket";
      occurredAt: string;
      title: string;
      description?: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      refId?: string;
    }
  | {
      id: string;
      type: "deal-change";
      occurredAt: string;
      title: string;
      description?: string;
      refId?: string;
    }
  | {
      id: string;
      type: "renewal";
      occurredAt: string;
      title: string;
      description?: string;
      refId?: string;
    };
