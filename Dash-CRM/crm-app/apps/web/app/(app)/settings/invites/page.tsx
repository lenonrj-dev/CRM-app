"use client";

import { useEffect, useMemo, useState } from "react";
import type { InviteDTO, Role } from "@ateliux/shared";
import { roleValues } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Button } from "../../../../components/ui/Button";
import { Drawer } from "../../../../components/ui/Drawer";
import { Input } from "../../../../components/ui/Input";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/Table";
import { createInvite, listInvites } from "../../../../features/settings/invites/api";
import { formatEnumLabel } from "../../../../lib/labels";

export default function InvitesPage() {
  const [invites, setInvites] = useState<InviteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), []);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const data = await listInvites();
      setInvites(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createInvite({ email, role, expiresInDays: Number(expiresInDays) || 7 });
      setDrawerOpen(false);
      setEmail("");
      setRole("USER");
      setExpiresInDays("7");
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o convite");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (token?: string) => {
    if (!token || !baseUrl) return;
    await navigator.clipboard.writeText(`${baseUrl}/invite/${token}`);
  };

  return (
    <RequirePermission permission="users:read">
      <div>
        <PageHeader
          title="Convites"
          subtitle="Convide pessoas para sua organização"
          actions={
            <Button onClick={() => setDrawerOpen(true)} pill>
              Novo convite
            </Button>
          }
        />

        {loading ? <p className="text-sm text-[var(--color-muted)]">Carregando convites...</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell className="font-semibold">{invite.email}</TableCell>
                <TableCell>{formatEnumLabel(invite.role)}</TableCell>
                <TableCell>{formatEnumLabel(invite.status)}</TableCell>
                <TableCell>{new Date(invite.expiresAt).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  {invite.token ? (
                    <Button type="button" variant="ghost" onClick={() => handleCopy(invite.token)}>
                      Copiar link
                    </Button>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">Indisponível</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!invites.length && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-[var(--color-muted)]">
                  Nenhum convite pendente.
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </Table>

        <Drawer open={drawerOpen} title="Novo convite" onClose={() => setDrawerOpen(false)}>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Perfil</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
              >
                {roleValues.map((value) => (
                  <option key={value} value={value}>
                    {formatEnumLabel(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                Expira em (dias)
              </label>
              <Input
                type="number"
                min={1}
                max={30}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                className="mt-2"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Enviando..." : "Criar convite"}
              </Button>
            </div>
          </form>
        </Drawer>
      </div>
    </RequirePermission>
  );
}
