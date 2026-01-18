import { Organization } from "../domains/auth/organization.model";
import { User } from "../domains/auth/user.model";
import { RefreshToken } from "../domains/auth/refreshToken.model";
import { Company } from "../domains/crm/company.model";
import { Contact } from "../domains/crm/contact.model";
import { Deal } from "../domains/crm/deal.model";
import { Activity } from "../domains/crm/activity.model";
import { Ticket } from "../domains/support/ticket.model";
import { AuditLog } from "../domains/settings/auditLog.model";
import { Campaign } from "../domains/marketing/campaign.model";
import { CustomerSuccessProfile } from "../domains/cs/csProfile.model";
import { Contract } from "../domains/cs/contract.model";
import { CatalogItem } from "../domains/sales/catalogItem.model";
import { Proposal } from "../domains/sales/proposal.model";
import { ApprovalRequest } from "../domains/sales/approvalRequest.model";
import { Workflow } from "../domains/automation/workflow.model";
import { WorkflowRun } from "../domains/automation/workflowRun.model";
import { Notification } from "../domains/notifications/notification.model";
import { Unit } from "../domains/org/unit.model";
import { Team } from "../domains/org/team.model";
import { Territory } from "../domains/org/territory.model";
import { UserMembership } from "../domains/org/membership.model";
import { SecurityPolicy } from "../domains/security/securityPolicy.model";
import { WebhookSubscription } from "../domains/integrations/webhook.model";
import { Event } from "../domains/events/event.model";
import { RetentionPolicy } from "../domains/compliance/retention.model";

export const resetDatabase = async () => {
  await Promise.all([
    Organization.deleteMany({}),
    User.deleteMany({}),
    RefreshToken.deleteMany({}),
    Company.deleteMany({}),
    Contact.deleteMany({}),
    Deal.deleteMany({}),
    Activity.deleteMany({}),
    Ticket.deleteMany({}),
    AuditLog.deleteMany({}),
    Campaign.deleteMany({}),
    CustomerSuccessProfile.deleteMany({}),
    Contract.deleteMany({}),
    CatalogItem.deleteMany({}),
    Proposal.deleteMany({}),
    ApprovalRequest.deleteMany({}),
    Workflow.deleteMany({}),
    WorkflowRun.deleteMany({}),
    Notification.deleteMany({}),
    Unit.deleteMany({}),
    Team.deleteMany({}),
    Territory.deleteMany({}),
    UserMembership.deleteMany({}),
    SecurityPolicy.deleteMany({}),
    WebhookSubscription.deleteMany({}),
    Event.deleteMany({}),
    RetentionPolicy.deleteMany({}),
  ]);
};
