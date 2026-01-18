"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { SearchResultGroup } from "@ateliux/shared";
import { apiFetch } from "../../lib/api";
import { Input } from "../ui/Input";

const typeLabels: Record<string, string> = {
  company: "Empresas",
  contact: "Contatos",
  deal: "Oportunidades",
  ticket: "Chamados",
};

const getHref = (type: string, id: string) => {
  switch (type) {
    case "company":
      return `/crm/companies/${id}`;
    case "contact":
      return `/crm/contacts/${id}`;
    case "deal":
      return `/crm/deals/${id}`;
    case "ticket":
      return `/support/tickets/${id}`;
    default:
      return "#";
  }
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setGroups([]);
        return;
      }
      setLoading(true);
      try {
        const data = await apiFetch<{ groups: SearchResultGroup[] }>(
          `/search?query=${encodeURIComponent(query.trim())}`,
        );
        setGroups(data.groups);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  const results = useMemo(
    () => groups.filter((group) => group.items.length > 0),
    [groups],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-72 items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent-strong)]"
        aria-label="Abrir busca global"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Buscar em tudo...</span>
        <span className="hidden rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] uppercase text-[var(--color-muted)] sm:inline">
          Ctrl K
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-24">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-white shadow-xl">
            <div className="border-b border-[var(--color-border)] px-6 py-4">
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar empresas, contatos, oportunidades, chamados..."
                aria-label="Busca global"
                className="w-full"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {loading ? <p className="text-sm text-[var(--color-muted)]">Buscando...</p> : null}
              {!loading && results.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">Nenhum resultado encontrado.</p>
              ) : null}
              {results.map((group) => (
                <div key={group.type} className="mb-6 last:mb-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    {typeLabels[group.type] ?? group.type}
                  </p>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={getHref(item.type, item.id)}
                        className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-sm transition hover:border-[var(--color-accent-strong)]"
                        onClick={() => setOpen(false)}
                      >
                        <p className="font-semibold text-[var(--color-ink)]">{item.title}</p>
                        {item.subtitle ? (
                          <p className="text-xs text-[var(--color-muted)]">{item.subtitle}</p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-3 text-xs text-[var(--color-muted)]">
              <span>Pressione Esc para fechar</span>
              <button type="button" className="font-semibold" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
