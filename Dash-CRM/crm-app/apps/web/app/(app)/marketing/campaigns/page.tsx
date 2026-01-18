"use client";

import { useEffect, useState } from "react";
import type { CampaignDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { ExportButton } from "../../../../components/shared/ExportButton";
import Link from "next/link";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { StatusBadge } from "../../../../components/shared/StatusBadge";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";
import { CampaignForm } from "../../../../features/marketing/campaigns/CampaignForm";
import {
  createCampaign,
  deleteCampaign,
  listCampaigns,
  updateCampaign,
} from "../../../../features/marketing/campaigns/api";
import { formatCurrency, formatDate } from "../../../../lib/utils";

const toneByStatus: Record<string, "accent" | "success" | "warning" | "neutral"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "neutral",
  PLANNED: "accent",
};

export default function MarketingCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignDTO | null>(null);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await listCampaigns();
      setCampaigns(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const handleEdit = (campaign: CampaignDTO) => {
    setEditing(campaign);
    setDrawerOpen(true);
  };

  const handleSubmit = async (payload: Partial<CampaignDTO>) => {
    if (editing) {
      await updateCampaign(editing.id, payload);
    } else {
      await createCampaign(payload);
    }
    setDrawerOpen(false);
    await loadCampaigns();
  };

  const handleDelete = async (campaignId: string) => {
    await deleteCampaign(campaignId);
    await loadCampaigns();
  };

  const canWrite = hasPermission(user?.role, "marketing:write");
  const canExport = hasPermission(user?.role, "exports:read");

  return (
    <RequirePermission permission="marketing:read">
      <div>
        <PageHeader
          title="Campanhas"
          subtitle="Planeje e acompanhe campanhas multicanais."
          actions={
            <div className="flex items-center gap-2">
              {canExport ? <ExportButton type="marketing:campaigns" /> : null}
              {canWrite ? (
                <Button onClick={handleCreate} pill>
                  Nova campanha
                </Button>
              ) : null}
            </div>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando campanhas...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-semibold">
                  <Link href={`/marketing/campaigns/${campaign.id}`} className="hover:text-[var(--color-accent-strong)]">
                    {campaign.name}
                  </Link>
                </TableCell>
                <TableCell>{campaign.channel}</TableCell>
                <TableCell>{campaign.budget ? formatCurrency(campaign.budget) : "-"}</TableCell>
                <TableCell>
                  {formatDate(campaign.startAt)} - {formatDate(campaign.endAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge label={campaign.status} tone={toneByStatus[campaign.status] ?? "neutral"} />
                </TableCell>
                <TableCell className="text-right">
                  {canWrite ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(campaign)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(campaign.id)}>
                        Excluir
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {!campaigns.length && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-[var(--color-muted)]">
                  Nenhuma campanha ainda.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer
          open={drawerOpen}
          title={editing ? "Editar campanha" : "Nova campanha"}
          onClose={() => setDrawerOpen(false)}
        >
          <CampaignForm
            initial={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </RequirePermission>
  );
}
