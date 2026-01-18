"use client";

import { useState } from "react";
import type { CompanyDTO } from "@ateliux/shared";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

export function CompanyForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<CompanyDTO>;
  onSubmit: (payload: Partial<CompanyDTO>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [size, setSize] = useState(initial?.size ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        industry: industry || undefined,
        website: website || undefined,
        size: size || undefined,
        tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a empresa");
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
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Segmento</label>
        <Input value={industry} onChange={(event) => setIndustry(event.target.value)} className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Site</label>
        <Input value={website} onChange={(event) => setWebsite(event.target.value)} className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Porte da empresa</label>
        <Input value={size} onChange={(event) => setSize(event.target.value)} className="mt-2" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Tags</label>
        <Input value={tags} onChange={(event) => setTags(event.target.value)} className="mt-2" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar empresa"}
        </Button>
      </div>
    </form>
  );
}
