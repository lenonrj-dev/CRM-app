"use client";

import { useState } from "react";
import { campaignStatusValues, type CampaignDTO } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { formatEnumLabel } from "../../../lib/labels";

export function CampaignForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<CampaignDTO>;
  onSubmit: (payload: Partial<CampaignDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [channel, setChannel] = useState(initial?.channel ?? "");
  const [budget, setBudget] = useState(initial?.budget?.toString() ?? "");
  const [status, setStatus] = useState(initial?.status ?? campaignStatusValues[0]);
  const [startAt, setStartAt] = useState(initial?.startAt?.slice(0, 10) ?? "");
  const [endAt, setEndAt] = useState(initial?.endAt?.slice(0, 10) ?? "");
  const [utmSource, setUtmSource] = useState(initial?.utm?.source ?? "");
  const [utmMedium, setUtmMedium] = useState(initial?.utm?.medium ?? "");
  const [utmCampaign, setUtmCampaign] = useState(initial?.utm?.campaign ?? "");
  const [utmTerm, setUtmTerm] = useState(initial?.utm?.term ?? "");
  const [utmContent, setUtmContent] = useState(initial?.utm?.content ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toIso = (value: string) => (value ? new Date(value).toISOString() : undefined);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        channel,
        budget: budget ? Number(budget) : undefined,
        status,
        startAt: toIso(startAt),
        endAt: toIso(endAt),
        utm: {
          source: utmSource || undefined,
          medium: utmMedium || undefined,
          campaign: utmCampaign || undefined,
          term: utmTerm || undefined,
          content: utmContent || undefined,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nome</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Canal</label>
        <Input value={channel} onChange={(event) => setChannel(event.target.value)} required className="mt-2" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Orçamento</label>
          <Input
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            type="number"
            min="0"
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Status</label>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2">
            {campaignStatusValues.map((value) => (
              <option key={value} value={value}>
                {formatEnumLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Data de início</label>
          <Input value={startAt} onChange={(event) => setStartAt(event.target.value)} type="date" className="mt-2" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Data de término</label>
          <Input value={endAt} onChange={(event) => setEndAt(event.target.value)} type="date" className="mt-2" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Parâmetros UTM</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <Input placeholder="utm_source" value={utmSource} onChange={(event) => setUtmSource(event.target.value)} />
          <Input placeholder="utm_medium" value={utmMedium} onChange={(event) => setUtmMedium(event.target.value)} />
          <Input placeholder="utm_campaign" value={utmCampaign} onChange={(event) => setUtmCampaign(event.target.value)} />
          <Input placeholder="utm_term" value={utmTerm} onChange={(event) => setUtmTerm(event.target.value)} />
          <Input placeholder="utm_content" value={utmContent} onChange={(event) => setUtmContent(event.target.value)} />
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar campanha"}
        </Button>
      </div>
    </form>
  );
}
