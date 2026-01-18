"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  dashboard: "Painel",
  crm: "CRM",
  companies: "Empresas",
  contacts: "Contatos",
  deals: "Oportunidades",
  activities: "Atividades",
  support: "Suporte",
  tickets: "Chamados",
  settings: "Configurações",
  "audit-logs": "Logs de auditoria",
  users: "Usuários",
  invites: "Convites",
  marketing: "Marketing",
  overview: "Visão geral",
  campaigns: "Campanhas",
  attribution: "Atribuição",
  scoring: "Pontuação",
  cs: "Sucesso do Cliente",
  accounts: "Contas",
  renewals: "Renovações",
  sales: "Vendas",
  catalog: "Catálogo",
  proposals: "Propostas",
  approvals: "Aprovações",
  automation: "Automação",
  workflows: "Fluxos",
  library: "Biblioteca",
  runs: "Execuções",
  notifications: "Notificações",
  org: "Organização",
  units: "Unidades",
  teams: "Times",
  territories: "Territórios",
  members: "Membros",
  integrations: "Integrações",
  webhooks: "Webhooks",
  compliance: "Conformidade",
  security: "Segurança",
};

const formatSegment = (segment: string) => {
  if (labelMap[segment]) return labelMap[segment];
  if (segment.length > 12) return `${segment.slice(0, 6)}...`;
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        {crumbs.length ? (
          <nav
            aria-label="Navegação estrutural"
            className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]"
          >
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-2">
                  {isLast ? (
                    <span className="font-semibold text-[var(--color-ink)]">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-[var(--color-ink)]">
                      {crumb.label}
                    </Link>
                  )}
                  {!isLast ? <span className="text-[var(--color-border)]">/</span> : null}
                </span>
              );
            })}
          </nav>
        ) : null}
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
