import { Campaign } from "../domains/marketing/campaign.model";
import { Company } from "../domains/crm/company.model";
import { applyTouch, calculateContactScore, calculateDealScore } from "../domains/marketing/scoring.service";
import type { SeedContext } from "./seedTypes";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const makeAttribution = (first: any, last: any) => {
  const firstTouch = applyTouch(undefined, { ...first, timestamp: first.timestamp ?? daysFromNow(-60) });
  return applyTouch(firstTouch, { ...last, timestamp: last.timestamp ?? daysFromNow(-3) });
};

const toCompanyDto = (company: any) => ({
  id: company._id.toString(),
  orgId: company.orgId.toString(),
  name: company.name,
  industry: company.industry,
  website: company.website,
  size: company.size,
  ownerId: company.ownerId?.toString(),
  tags: company.tags ?? [],
  createdAt: company.createdAt.toISOString(),
  updatedAt: company.updatedAt.toISOString(),
});

const toContactDto = (contact: any) => ({
  id: contact._id.toString(),
  orgId: contact.orgId.toString(),
  firstName: contact.firstName,
  lastName: contact.lastName,
  email: contact.email,
  phone: contact.phone,
  title: contact.title,
  companyId: contact.companyId?.toString(),
  ownerId: contact.ownerId?.toString(),
  createdFrom: contact.createdFrom,
  attribution: contact.attribution,
  leadScore: contact.leadScore,
  createdAt: contact.createdAt.toISOString(),
  updatedAt: contact.updatedAt.toISOString(),
});

export const seedMarketing = async (ctx: SeedContext) => {
  await Campaign.create([
    {
      orgId: ctx.org._id,
      name: "Impulso de funil Q1",
      channel: "Busca paga",
      budget: 45000,
      startAt: new Date(daysFromNow(-30)),
      endAt: new Date(daysFromNow(60)),
      status: "ACTIVE",
      utm: { source: "google", medium: "cpc", campaign: "q1-pipeline" },
    },
    {
      orgId: ctx.org._id,
      name: "Sprint ABM corporativo",
      channel: "Anúncios no LinkedIn",
      budget: 32000,
      startAt: new Date(daysFromNow(-10)),
      endAt: new Date(daysFromNow(50)),
      status: "ACTIVE",
      utm: { source: "linkedin", medium: "paid", campaign: "enterprise-abm" },
    },
    {
      orgId: ctx.org._id,
      name: "Série de webinars com parceiros",
      channel: "Webinar",
      budget: 12000,
      startAt: new Date(daysFromNow(-5)),
      endAt: new Date(daysFromNow(20)),
      status: "PLANNED",
      utm: { source: "partner", medium: "webinar", campaign: "growth-lab" },
    },
  ]);

  const contactPlans = [
    {
      contact: ctx.contacts[0],
      createdFrom: "web",
      first: {
        utm: { source: "google", medium: "cpc", campaign: "q1-pipeline" },
        landingPage: "/signup",
        referrer: "https://google.com",
        createdFrom: "web",
        timestamp: daysFromNow(-80),
      },
      last: {
        utm: { source: "google", medium: "cpc", campaign: "q1-pipeline", term: "crm" },
        landingPage: "/pricing",
        referrer: "https://google.com",
        createdFrom: "web",
        timestamp: daysFromNow(-5),
      },
    },
    {
      contact: ctx.contacts[1],
      createdFrom: "form",
      first: {
        utm: { source: "linkedin", medium: "paid", campaign: "enterprise-abm" },
        landingPage: "/enterprise",
        referrer: "https://linkedin.com",
        createdFrom: "form",
        timestamp: daysFromNow(-40),
      },
      last: {
        utm: { source: "linkedin", medium: "paid", campaign: "enterprise-abm" },
        landingPage: "/demo",
        referrer: "https://linkedin.com",
        createdFrom: "form",
        timestamp: daysFromNow(-3),
      },
    },
    {
      contact: ctx.contacts[2],
      createdFrom: "manual",
      first: {
        utm: { source: "partner", medium: "webinar", campaign: "growth-lab" },
        landingPage: "/webinar",
        referrer: "https://partner.com",
        createdFrom: "web",
        timestamp: daysFromNow(-25),
      },
      last: {
        utm: { source: "partner", medium: "webinar", campaign: "growth-lab" },
        landingPage: "/ebook",
        referrer: "https://partner.com",
        createdFrom: "web",
        timestamp: daysFromNow(-7),
      },
    },
  ];

  for (const plan of contactPlans) {
    const attribution = makeAttribution(plan.first, plan.last);
    plan.contact.createdFrom = plan.createdFrom;
    plan.contact.attribution = attribution as any;

    const company = ctx.companies.find(
      (item) => String(item._id) === String(plan.contact.companyId),
    );
    const hasOpenHighTickets = ctx.tickets.some(
      (ticket) =>
        String(ticket.companyId) === String(plan.contact.companyId) &&
        ["OPEN", "PENDING"].includes(ticket.status) &&
        ["HIGH", "URGENT"].includes(ticket.priority),
    );
    const hasRecentDeal = ctx.deals.some((deal) => String(deal.contactId) === String(plan.contact._id));

    plan.contact.leadScore = calculateContactScore({
      contact: toContactDto(plan.contact),
      company: company ? toCompanyDto(company) : null,
      hasOpenHighTickets,
      hasRecentDeal,
    }) as any;

    await plan.contact.save();
  }

  const dealPlans = [
    {
      deal: ctx.deals[0],
      createdFrom: "manual",
      first: {
        utm: { source: "google", medium: "cpc", campaign: "q1-pipeline" },
        landingPage: "/pricing",
        referrer: "https://google.com",
        createdFrom: "web",
        timestamp: daysFromNow(-35),
      },
      last: {
        utm: { source: "google", medium: "cpc", campaign: "q1-pipeline" },
        landingPage: "/proposal",
        referrer: "https://google.com",
        createdFrom: "manual",
        timestamp: daysFromNow(-2),
      },
    },
    {
      deal: ctx.deals[1],
      createdFrom: "import",
      first: {
        utm: { source: "linkedin", medium: "paid", campaign: "enterprise-abm" },
        landingPage: "/enterprise",
        referrer: "https://linkedin.com",
        createdFrom: "form",
        timestamp: daysFromNow(-50),
      },
      last: {
        utm: { source: "linkedin", medium: "paid", campaign: "enterprise-abm" },
        landingPage: "/security",
        referrer: "https://linkedin.com",
        createdFrom: "import",
        timestamp: daysFromNow(-6),
      },
    },
    {
      deal: ctx.deals[2],
      createdFrom: "web",
      first: {
        utm: { source: "partner", medium: "webinar", campaign: "growth-lab" },
        landingPage: "/webinar",
        referrer: "https://partner.com",
        createdFrom: "web",
        timestamp: daysFromNow(-20),
      },
      last: {
        utm: { source: "partner", medium: "webinar", campaign: "growth-lab" },
        landingPage: "/case-studies",
        referrer: "https://partner.com",
        createdFrom: "web",
        timestamp: daysFromNow(-1),
      },
    },
  ];

  for (const plan of dealPlans) {
    const attribution = makeAttribution(plan.first, plan.last);
    plan.deal.createdFrom = plan.createdFrom;
    plan.deal.attribution = attribution as any;
    plan.deal.leadScore = calculateDealScore({
      id: plan.deal._id.toString(),
      orgId: plan.deal.orgId.toString(),
      name: plan.deal.name,
      stage: plan.deal.stage,
      value: plan.deal.value,
      expectedCloseDate: plan.deal.expectedCloseDate?.toISOString(),
      ownerId: plan.deal.ownerId?.toString(),
      companyId: plan.deal.companyId?.toString(),
      contactId: plan.deal.contactId?.toString(),
      lostReason: plan.deal.lostReason,
      createdFrom: plan.deal.createdFrom,
      attribution: plan.deal.attribution as any,
      leadScore: plan.deal.leadScore as any,
      createdAt: plan.deal.createdAt.toISOString(),
      updatedAt: plan.deal.updatedAt.toISOString(),
    }) as any;
    await plan.deal.save();
  }

  const companyAttribution = makeAttribution(
    {
      utm: { source: "google", medium: "cpc", campaign: "q1-pipeline" },
      landingPage: "/signup",
      referrer: "https://google.com",
      createdFrom: "web",
      timestamp: daysFromNow(-90),
    },
    {
      utm: { source: "partner", medium: "webinar", campaign: "growth-lab" },
      landingPage: "/partners",
      referrer: "https://partner.com",
      createdFrom: "import",
      timestamp: daysFromNow(-15),
    },
  );

  await Company.updateOne(
    { _id: ctx.companies[0]._id },
    { createdFrom: "import", attribution: companyAttribution },
  );
};
