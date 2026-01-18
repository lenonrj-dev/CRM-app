"use client";

import { useEffect, useState } from "react";
import type { OrganizationDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Card, CardContent } from "../../../../components/ui/Card";
import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import { getOrganization, updateOrganization } from "../../../../features/settings/org/api";

export default function OrgSettingsPage() {
  const [organization, setOrganization] = useState<OrganizationDTO | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadOrganization = async () => {
    setLoading(true);
    try {
      const data = await getOrganization();
      setOrganization(data.organization);
      setName(data.organization.name);
      setSlug(data.organization.slug);
      setCurrency(data.organization.currency ?? "BRL");
      setTimezone(data.organization.timezone ?? "America/Sao_Paulo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const data = await updateOrganization({ name, slug, currency, timezone });
      setOrganization(data.organization);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a organização");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequirePermission permission="org:read">
      <div>
        <PageHeader title="Organização" subtitle="Identidade e preferências da sua empresa" />

        <Card>
          <CardContent>
            {loading ? (
              <p className="text-sm text-[var(--color-muted)]">Carregando organização...</p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nome</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} className="mt-2" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Slug</label>
                    <Input value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Plano
                    </label>
                    <Input value={organization?.plan ?? "-"} readOnly className="mt-2" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Moeda</label>
                    <Input value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Fuso horário
                    </label>
                    <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} className="mt-2" />
                  </div>
                </div>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                {success ? (
                  <p className="text-sm text-emerald-600">Organização atualizada com sucesso.</p>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}
