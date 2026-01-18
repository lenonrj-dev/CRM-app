import type { TimelineEvent } from "@ateliux/shared";

export const toCompanyDto = (company: any) => ({
  id: company._id.toString(),
  orgId: company.orgId.toString(),
  name: company.name,
  industry: company.industry,
  website: company.website,
  size: company.size,
  region: company.region,
  ownerId: company.ownerId?.toString(),
  unitId: company.unitId?.toString(),
  teamId: company.teamId?.toString(),
  visibilityScope: company.visibilityScope,
  tags: company.tags ?? [],
  createdFrom: company.createdFrom,
  attribution: company.attribution,
  createdAt: company.createdAt.toISOString(),
  updatedAt: company.updatedAt.toISOString(),
});

export const mapContact = (contact: any) => ({
  id: contact._id.toString(),
  orgId: contact.orgId.toString(),
  firstName: contact.firstName,
  lastName: contact.lastName,
  email: contact.email,
  phone: contact.phone,
  title: contact.title,
  companyId: contact.companyId?.toString(),
  ownerId: contact.ownerId?.toString(),
  unitId: contact.unitId?.toString(),
  teamId: contact.teamId?.toString(),
  visibilityScope: contact.visibilityScope,
  createdFrom: contact.createdFrom,
  attribution: contact.attribution,
  leadScore: contact.leadScore,
  createdAt: contact.createdAt.toISOString(),
  updatedAt: contact.updatedAt.toISOString(),
});

export const mapDeal = (deal: any) => ({
  id: deal._id.toString(),
  orgId: deal.orgId.toString(),
  name: deal.name,
  stage: deal.stage,
  value: deal.value,
  expectedCloseDate: deal.expectedCloseDate?.toISOString(),
  ownerId: deal.ownerId?.toString(),
  companyId: deal.companyId?.toString(),
  contactId: deal.contactId?.toString(),
  unitId: deal.unitId?.toString(),
  teamId: deal.teamId?.toString(),
  visibilityScope: deal.visibilityScope,
  lostReason: deal.lostReason,
  createdFrom: deal.createdFrom,
  attribution: deal.attribution,
  leadScore: deal.leadScore,
  createdAt: deal.createdAt.toISOString(),
  updatedAt: deal.updatedAt.toISOString(),
});

export const mapActivity = (activity: any) => ({
  id: activity._id.toString(),
  orgId: activity.orgId.toString(),
  type: activity.type,
  subject: activity.subject,
  dueDate: activity.dueDate?.toISOString(),
  completed: activity.completed,
  notes: activity.notes,
  contactId: activity.contactId?.toString(),
  companyId: activity.companyId?.toString(),
  dealId: activity.dealId?.toString(),
  ownerId: activity.ownerId?.toString(),
  unitId: activity.unitId?.toString(),
  teamId: activity.teamId?.toString(),
  visibilityScope: activity.visibilityScope,
  createdAt: activity.createdAt.toISOString(),
  updatedAt: activity.updatedAt.toISOString(),
});

export const mapTicket = (ticket: any) => ({
  id: ticket._id.toString(),
  orgId: ticket.orgId.toString(),
  title: ticket.title,
  description: ticket.description,
  status: ticket.status,
  priority: ticket.priority,
  companyId: ticket.companyId?.toString(),
  contactId: ticket.contactId?.toString(),
  assignedTo: ticket.assignedTo?.toString(),
  unitId: ticket.unitId?.toString(),
  teamId: ticket.teamId?.toString(),
  visibilityScope: ticket.visibilityScope,
  comments: ticket.comments?.map((comment: any) => ({
    id: comment._id.toString(),
    authorId: comment.authorId.toString(),
    body: comment.body,
    isInternal: comment.isInternal,
    createdAt: comment.createdAt.toISOString(),
  })),
  createdAt: ticket.createdAt.toISOString(),
  updatedAt: ticket.updatedAt.toISOString(),
});

export const buildTimeline = (params: {
  activities: any[];
  tickets: any[];
  dealEvents: any[];
  renewalEvents?: Array<{ id: string; title: string; description?: string; occurredAt: Date }>;
}) => {
  const { activities, tickets, dealEvents, renewalEvents = [] } = params;
  const timeline: TimelineEvent[] = [
    ...activities.map((activity) => ({
      id: activity._id.toString(),
      type: "activity" as const,
      occurredAt: activity.createdAt.toISOString(),
      title: activity.subject,
      description: activity.notes,
      refId: activity._id.toString(),
    })),
    ...tickets.map((ticket) => ({
      id: ticket._id.toString(),
      type: "ticket" as const,
      occurredAt: ticket.createdAt.toISOString(),
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      refId: ticket._id.toString(),
    })),
    ...dealEvents.map((event) => ({
      id: event._id.toString(),
      type: "deal-change" as const,
      occurredAt: event.createdAt.toISOString(),
      title: event.summary ?? "Oportunidade atualizada",
      description: event.changes?.stage
        ? `Etapa: ${event.changes.stage.from ?? "-"} -> ${event.changes.stage.to ?? "-"}`
        : event.summary,
      refId: event.entityId,
    })),
    ...renewalEvents.map((event) => ({
      id: event.id,
      type: "renewal" as const,
      occurredAt: event.occurredAt.toISOString(),
      title: event.title,
      description: event.description,
      refId: event.id,
    })),
  ];

  return timeline.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
};
