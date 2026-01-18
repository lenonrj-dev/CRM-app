"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../features/auth/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ name, email, password, orgName });
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar a conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Ateliux CRM</p>
        <h1 className="mt-3 text-3xl font-semibold">Crie sua conta</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Comece com uma nova organização</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Seu nome</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Nome da organização
          </label>
          <Input value={orgName} onChange={(event) => setOrgName(event.target.value)} required className="mt-2" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">E-mail</label>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2"
          />
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <div className="mt-4 text-center text-xs text-[var(--color-muted)]">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-[var(--color-accent-strong)]">
          Entrar
        </Link>
      </div>
    </div>
  );
}
