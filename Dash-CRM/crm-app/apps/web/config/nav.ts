import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Building2,
  Users,
  KanbanSquare,
  ListTodo,
  LifeBuoy,
  UserCog,
  FileText,
  Megaphone,
  Target,
  BarChart3,
  Sparkles,
  HeartPulse,
  BadgeCheck,
  RefreshCw,
  Library,
  Workflow,
  Bell,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { Permission, Role } from "@ateliux/shared";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  roles?: Role[];
};

export const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { label: "Painel", href: "/dashboard", icon: LayoutGrid, permission: "dashboard:read" },
      { label: "Notificações", href: "/notifications", icon: Bell, permission: "notifications:read" },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Empresas", href: "/crm/companies", icon: Building2, permission: "crm:read" },
      { label: "Contatos", href: "/crm/contacts", icon: Users, permission: "crm:read" },
      { label: "Oportunidades", href: "/crm/deals", icon: KanbanSquare, permission: "crm:read" },
      { label: "Atividades", href: "/crm/activities", icon: ListTodo, permission: "crm:read" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Visão geral", href: "/marketing/overview", icon: Megaphone, permission: "marketing:read" },
      { label: "Campanhas", href: "/marketing/campaigns", icon: Target, permission: "marketing:read" },
      { label: "Atribuição", href: "/marketing/attribution", icon: BarChart3, permission: "marketing:read" },
      { label: "Pontuação", href: "/marketing/scoring", icon: Sparkles, permission: "marketing:read" },
    ],
  },
  {
    title: "Sucesso do Cliente",
    items: [
      { label: "Visão geral", href: "/cs/overview", icon: HeartPulse, permission: "cs:read" },
      { label: "Contas", href: "/cs/accounts", icon: BadgeCheck, permission: "cs:read" },
      { label: "Renovações", href: "/cs/renewals", icon: RefreshCw, permission: "cs:read" },
    ],
  },
  {
    title: "Vendas",
    items: [
      { label: "Catálogo", href: "/sales/catalog", icon: ClipboardList, permission: "sales:read" },
      { label: "Propostas", href: "/sales/proposals", icon: CreditCard, permission: "sales:read" },
      {
        label: "Aprovações",
        href: "/sales/approvals",
        icon: ShieldCheck,
        permission: "sales:read",
        roles: ["OWNER", "ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Automação",
    items: [
      { label: "Fluxos", href: "/automation/workflows", icon: Workflow, permission: "automation:read" },
      { label: "Biblioteca", href: "/automation/workflows/library", icon: Library, permission: "automation:read" },
      { label: "Execuções", href: "/automation/runs", icon: BarChart3, permission: "automation:read" },
    ],
  },
  {
    title: "Suporte",
    items: [
      { label: "Chamados", href: "/support/tickets", icon: LifeBuoy, permission: "support:read" },
    ],
  },
  {
    title: "Organização",
    items: [
      { label: "Dados da organização", href: "/settings/org", icon: Building2, permission: "org:read" },
      { label: "Unidades", href: "/settings/org/units", icon: Building2, permission: "org:read" },
      { label: "Times", href: "/settings/org/teams", icon: Users, permission: "org:read" },
      { label: "Territórios", href: "/settings/org/territories", icon: Target, permission: "org:read" },
      { label: "Membros", href: "/settings/org/members", icon: BadgeCheck, permission: "org:read" },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Usuários", href: "/settings/users", icon: UserCog, permission: "users:read" },
      { label: "Convites", href: "/settings/invites", icon: UserPlus, permission: "users:read" },
      { label: "Segurança", href: "/settings/security", icon: ShieldCheck, permission: "security:read" },
      { label: "Logs de auditoria", href: "/settings/audit-logs", icon: FileText, permission: "audit:read" },
      {
        label: "Integrações",
        href: "/settings/integrations/webhooks",
        icon: Workflow,
        permission: "integrations:read",
      },
      { label: "Conformidade", href: "/settings/compliance", icon: ClipboardList, permission: "compliance:read" },
    ],
  },
];
