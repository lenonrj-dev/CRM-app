import bcrypt from "bcryptjs";
import { Organization } from "../domains/auth/organization.model";
import { User } from "../domains/auth/user.model";
import { Company } from "../domains/crm/company.model";
import { Contact } from "../domains/crm/contact.model";
import { Deal } from "../domains/crm/deal.model";
import { Activity } from "../domains/crm/activity.model";
import { Ticket } from "../domains/support/ticket.model";
import { Unit } from "../domains/org/unit.model";
import { Team } from "../domains/org/team.model";
import { Territory } from "../domains/org/territory.model";
import { UserMembership } from "../domains/org/membership.model";
import type { SeedContext } from "./seedTypes";

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export const seedCore = async (): Promise<SeedContext> => {
  const org = await Organization.create({
    name: "Ateliux Demonstração",
    slug: "ateliux-demo",
    plan: "PRO",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    onboardingCompleted: true,
  });
  const passwordHash = await bcrypt.hash("Ateliux123!", 10);

  const users = await User.create([
    { name: "Olivia Owner", email: "owner@ateliux.local", passwordHash, role: "OWNER", orgId: org._id },
    { name: "Aline Administradora", email: "admin@ateliux.local", passwordHash, role: "ADMIN", orgId: org._id },
    {
      name: "Marcos Gerente",
      email: "manager@ateliux.local",
      passwordHash,
      role: "MANAGER",
      orgId: org._id,
    },
    { name: "Sofia Operações", email: "user@ateliux.local", passwordHash, role: "USER", orgId: org._id },
    { name: "Vera Visualizadora", email: "viewer@ateliux.local", passwordHash, role: "VIEWER", orgId: org._id },
    { name: "Clara Cliente", email: "client@ateliux.local", passwordHash, role: "CLIENT", orgId: org._id },
  ]);

  const [owner, admin, manager, user, viewer, client] = users;

  const units = await Unit.create([
    { orgId: org._id, name: "Sede São Paulo", region: "SP" },
    { orgId: org._id, name: "Polo Rio", region: "RJ" },
    { orgId: org._id, name: "Remoto", region: "Remoto" },
  ]);

  const teams = await Team.create([
    { orgId: org._id, unitId: units[0]._id, name: "Vendas Empresariais", color: "#24c7da" },
    { orgId: org._id, unitId: units[0]._id, name: "Renovações CS", color: "#6a7078" },
    { orgId: org._id, unitId: units[1]._id, name: "Suporte Nível 1", color: "#12a9bc" },
  ]);

  await Territory.create([
    {
      orgId: org._id,
      name: "Tecnologia-SP",
      unitId: units[0]._id,
      teamId: teams[0]._id,
      ownerId: user._id,
      rules: { regions: ["SP"], industries: ["Tecnologia"] },
    },
    {
      orgId: org._id,
      name: "Financeiro-RJ",
      unitId: units[1]._id,
      teamId: teams[0]._id,
      ownerId: manager._id,
      rules: { regions: ["RJ"], industries: ["Financeiro"] },
    },
  ]);

  await UserMembership.create([
    {
      userId: owner._id,
      orgId: org._id,
      unitId: units[0]._id,
      teamIds: [teams[0]._id],
      role: "OWNER",
      scope: "ORG",
      status: "ACTIVE",
    },
    {
      userId: admin._id,
      orgId: org._id,
      unitId: units[0]._id,
      teamIds: [teams[0]._id],
      role: "ADMIN",
      scope: "ORG",
      status: "ACTIVE",
    },
    {
      userId: manager._id,
      orgId: org._id,
      unitId: units[0]._id,
      teamIds: [teams[1]._id],
      role: "MANAGER",
      scope: "UNIT",
      status: "ACTIVE",
    },
    {
      userId: user._id,
      orgId: org._id,
      unitId: units[0]._id,
      teamIds: [teams[0]._id],
      role: "USER",
      scope: "TEAM",
      status: "ACTIVE",
    },
    {
      userId: viewer._id,
      orgId: org._id,
      unitId: units[0]._id,
      teamIds: [teams[0]._id],
      role: "VIEWER",
      scope: "OWNED_ONLY",
      status: "ACTIVE",
    },
    {
      userId: client._id,
      orgId: org._id,
      unitId: units[1]._id,
      teamIds: [teams[2]._id],
      role: "CLIENT",
      scope: "OWNED_ONLY",
      status: "ACTIVE",
    },
  ]);

  const companies = await Company.create([
    {
      orgId: org._id,
      name: "Nuvora Labs",
      industry: "Tecnologia",
      website: "https://nuvora.io",
      size: "120-250",
      region: "SP",
      ownerId: user._id,
      unitId: units[0]._id,
      teamId: teams[0]._id,
      visibilityScope: "TEAM",
      tags: ["B2B", "SaaS"],
    },
    {
      orgId: org._id,
      name: "Aurum Finance",
      industry: "Financeiro",
      website: "https://aurumfinance.com",
      size: "50-100",
      region: "RJ",
      ownerId: manager._id,
      unitId: units[1]._id,
      teamId: teams[0]._id,
      visibilityScope: "UNIT",
      tags: ["Corporativo"],
    },
    {
      orgId: org._id,
      name: "Lumen Health",
      industry: "Saúde",
      website: "https://lumen.health",
      size: "200+",
      region: "SP",
      ownerId: owner._id,
      unitId: units[0]._id,
      teamId: teams[1]._id,
      visibilityScope: "ORG",
      tags: ["Clínico"],
    },
  ]);

  const contacts = await Contact.create([
    {
      orgId: org._id,
      firstName: "Isabela",
      lastName: "Ramos",
      email: "isabela@nuvora.io",
      phone: "+55 11 98888-1111",
      title: "Líder de Operações",
      companyId: companies[0]._id,
      ownerId: user._id,
      unitId: units[0]._id,
      teamId: teams[0]._id,
      visibilityScope: "TEAM",
    },
    {
      orgId: org._id,
      firstName: "Eduardo",
      lastName: "Lima",
      email: "eduardo@aurumfinance.com",
      phone: "+55 11 97777-2222",
      title: "CFO",
      companyId: companies[1]._id,
      ownerId: manager._id,
      unitId: units[1]._id,
      teamId: teams[0]._id,
      visibilityScope: "UNIT",
    },
    {
      orgId: org._id,
      firstName: "Camila",
      lastName: "Pires",
      email: "camila@lumen.health",
      phone: "+55 11 96666-3333",
      title: "Gerente de Operações",
      companyId: companies[2]._id,
      ownerId: owner._id,
      unitId: units[0]._id,
      teamId: teams[1]._id,
      visibilityScope: "ORG",
    },
  ]);

  const deals = await Deal.create([
    {
      orgId: org._id,
      name: "Plataforma Analítica",
      stage: "QUALIFIED",
      value: 120000,
      expectedCloseDate: daysFromNow(30),
      ownerId: user._id,
      companyId: companies[0]._id,
      contactId: contacts[0]._id,
      unitId: units[0]._id,
      teamId: teams[0]._id,
      visibilityScope: "TEAM",
    },
    {
      orgId: org._id,
      name: "Expansão regional",
      stage: "PROPOSAL",
      value: 85000,
      expectedCloseDate: daysFromNow(45),
      ownerId: manager._id,
      companyId: companies[1]._id,
      contactId: contacts[1]._id,
      unitId: units[1]._id,
      teamId: teams[0]._id,
      visibilityScope: "UNIT",
    },
    {
      orgId: org._id,
      name: "Pacote de Atendimento",
      stage: "NEGOTIATION",
      value: 145000,
      expectedCloseDate: daysFromNow(60),
      ownerId: owner._id,
      companyId: companies[2]._id,
      contactId: contacts[2]._id,
      unitId: units[0]._id,
      teamId: teams[1]._id,
      visibilityScope: "ORG",
    },
  ]);

  const activities = await Activity.create([
    {
      orgId: org._id,
      type: "CALL",
      subject: "Chamada de alinhamento",
      dueDate: daysFromNow(2),
      completed: false,
      notes: "Revisar requisitos e cronograma.",
      contactId: contacts[0]._id,
      companyId: companies[0]._id,
      dealId: deals[0]._id,
      ownerId: user._id,
      unitId: units[0]._id,
      teamId: teams[0]._id,
      visibilityScope: "TEAM",
    },
    {
      orgId: org._id,
      type: "MEETING",
      subject: "Revisão executiva",
      dueDate: daysFromNow(4),
      completed: false,
      notes: "Alinhar o plano de implantação com as partes interessadas.",
      contactId: contacts[1]._id,
      companyId: companies[1]._id,
      dealId: deals[1]._id,
      ownerId: manager._id,
      unitId: units[1]._id,
      teamId: teams[0]._id,
      visibilityScope: "UNIT",
    },
    {
      orgId: org._id,
      type: "TASK",
      subject: "Enviar proposta atualizada",
      dueDate: daysFromNow(1),
      completed: false,
      notes: "Atualizar preços e incluir o cronograma.",
      contactId: contacts[2]._id,
      companyId: companies[2]._id,
      dealId: deals[2]._id,
      ownerId: owner._id,
      unitId: units[0]._id,
      teamId: teams[1]._id,
      visibilityScope: "ORG",
    },
  ]);

  const tickets = await Ticket.create([
    {
      orgId: org._id,
      title: "Atraso na implantação",
      description: "Cliente relata atrasos na ativação.",
      status: "OPEN",
      priority: "HIGH",
      companyId: companies[0]._id,
      contactId: contacts[0]._id,
      assignedTo: user._id,
      createdBy: user._id,
      unitId: units[1]._id,
      teamId: teams[2]._id,
      visibilityScope: "TEAM",
      comments: [
        {
          authorId: user._id,
          body: "Coletando logs e validando com engenharia.",
          isInternal: true,
          createdAt: new Date(),
        },
      ],
    },
    {
      orgId: org._id,
      title: "Problema na integração do ERP",
      description: "Erro de sincronização durante a importação de pedidos.",
      status: "PENDING",
      priority: "URGENT",
      companyId: companies[1]._id,
      contactId: contacts[1]._id,
      assignedTo: user._id,
      createdBy: user._id,
      unitId: units[1]._id,
      teamId: teams[2]._id,
      visibilityScope: "TEAM",
      comments: [],
    },
    {
      orgId: org._id,
      title: "Dúvida de faturamento",
      description: "Cliente solicita detalhes da fatura.",
      status: "RESOLVED",
      priority: "MEDIUM",
      companyId: companies[2]._id,
      contactId: contacts[2]._id,
      assignedTo: user._id,
      createdBy: client._id,
      unitId: units[1]._id,
      teamId: teams[2]._id,
      visibilityScope: "TEAM",
      comments: [],
    },
  ]);

  return {
    org,
    users: { owner, admin, manager, user, viewer, client, all: users },
    companies,
    contacts,
    deals,
    activities,
    tickets,
  };
};
