"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import { useAuth } from "../../../../features/auth/auth-context";

type InvitePreview = {
  email: string;
  role: string;
  organization: { name: string };
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { acceptInvite } = useAuth();
  const token = params?.token as string;

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvite = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/invites/${token}`,
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message ?? "Convite inválido");
        }
        const data = (await response.json()) as {
          invite: { email: string; role: string };
          organization: { name: string };
        };
        setInvite({ email: data.invite.email, role: data.invite.role, organization: data.organization });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Convite inválido");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInvite();
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await acceptInvite({ token, name, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao aceitar convite");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Carregando convite...</p>;
  }

  if (!invite) {
    return <p className="text-sm text-red-600">{error ?? "Convite inválido."}</p>;
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Ateliux CRM</p>
        <h1 className="mt-3 text-3xl font-semibold">Você foi convidado(a)</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {invite.organization.name} • {invite.email}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Nome completo</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Senha</label>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Aceitando..." : "Aceitar convite"}
        </Button>
      </form>
    </div>
  );
}
