import { Company } from "../crm/company.model";
import { Contact } from "../crm/contact.model";
import { Deal } from "../crm/deal.model";
import { Activity } from "../crm/activity.model";
import { Ticket } from "../support/ticket.model";
import { UserMembership } from "../org/membership.model";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export const createDemoData = async (params: { orgId: string; ownerId: string }) => {
  const { orgId, ownerId } = params;
  const membership = await UserMembership.findOne({ userId: ownerId, orgId }).lean();
  const unitId = membership?.unitId;
  const teamId = membership?.teamIds?.[0];
  const visibilityScope = membership?.scope ?? "ORG";

  const companies = await Company.create([
    {
      orgId,
      name: "Aurora Health",
      industry: "Saúde",
      website: "https://aurora.health",
      size: "50-100",
      region: "SP",
      ownerId,
      unitId,
      teamId,
      visibilityScope,
      tags: ["B2B", "Assinatura"],
    },
    {
      orgId,
      name: "Lumen Fintech",
      industry: "Financeiro",
      website: "https://lumenfintech.com",
      size: "100-200",
      region: "RJ",
      ownerId,
      unitId,
      teamId,
      visibilityScope,
      tags: ["Enterprise"],
    },
  ]);

  const contacts = await Contact.create([
    {
      orgId,
      firstName: "Carla",
      lastName: "Oliveira",
      email: "carla@aurora.health",
      phone: "+55 11 95555-0001",
      title: "Coordenadora de Compras",
      companyId: companies[0]._id,
      ownerId,
      unitId,
      teamId,
      visibilityScope,
    },
    {
      orgId,
      firstName: "Rafael",
      lastName: "Costa",
      email: "rafael@lumenfintech.com",
      phone: "+55 21 94444-0002",
      title: "Head de Operações",
      companyId: companies[1]._id,
      ownerId,
      unitId,
      teamId,
      visibilityScope,
    },
  ]);

  const deals = await Deal.create([
    {
      orgId,
      name: "Pacote CRM + Automação",
      stage: "PROPOSAL",
      value: 54000,
      expectedCloseDate: daysFromNow(25),
      ownerId,
      companyId: companies[0]._id,
      contactId: contacts[0]._id,
      unitId,
      teamId,
      visibilityScope,
    },
    {
      orgId,
      name: "Suite Enterprise",
      stage: "QUALIFIED",
      value: 98000,
      expectedCloseDate: daysFromNow(40),
      ownerId,
      companyId: companies[1]._id,
      contactId: contacts[1]._id,
      unitId,
      teamId,
      visibilityScope,
    },
  ]);

  const activities = await Activity.create([
    {
      orgId,
      type: "CALL",
      subject: "Contato inicial",
      dueDate: daysFromNow(1),
      completed: false,
      notes: "Validar necessidade e próximos passos.",
      contactId: contacts[0]._id,
      companyId: companies[0]._id,
      dealId: deals[0]._id,
      ownerId,
      unitId,
      teamId,
      visibilityScope,
    },
    {
      orgId,
      type: "TASK",
      subject: "Enviar proposta",
      dueDate: daysFromNow(3),
      completed: false,
      notes: "Enviar proposta com termos comerciais.",
      contactId: contacts[1]._id,
      companyId: companies[1]._id,
      dealId: deals[1]._id,
      ownerId,
      unitId,
      teamId,
      visibilityScope,
    },
  ]);

  const tickets = await Ticket.create([
    {
      orgId,
      title: "Dúvida sobre implantação",
      description: "Cliente pediu cronograma detalhado de implantação.",
      status: "OPEN",
      priority: "MEDIUM",
      companyId: companies[0]._id,
      contactId: contacts[0]._id,
      assignedTo: ownerId,
      createdBy: ownerId,
      unitId,
      teamId,
      visibilityScope,
      comments: [],
    },
    {
      orgId,
      title: "Integração com ERP",
      description: "Solicitação de escopo para integração com ERP legado.",
      status: "PENDING",
      priority: "HIGH",
      companyId: companies[1]._id,
      contactId: contacts[1]._id,
      assignedTo: ownerId,
      createdBy: ownerId,
      unitId,
      teamId,
      visibilityScope,
      comments: [],
    },
  ]);

  return { companies, contacts, deals, activities, tickets };
};
