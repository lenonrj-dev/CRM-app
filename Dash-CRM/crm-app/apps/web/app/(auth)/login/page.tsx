"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../features/auth/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password, twoFactorRequired ? twoFactorCode : undefined);
      if (result.requiresTwoFactor) {
        setTwoFactorRequired(true);
        setError("Digite seu código de autenticação para continuar.");
        return;
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Ateliux CRM</p>
        <h1 className="mt-3 text-3xl font-semibold">Bem-vindo(a) de volta</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Entre para continuar no seu workspace</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">E-mail</label>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Senha</label>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2"
          />
        </div>
        {twoFactorRequired ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Código 2FA</label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={twoFactorCode}
              onChange={(event) => setTwoFactorCode(event.target.value)}
              className="mt-2"
            />
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-4 text-center text-xs text-[var(--color-muted)]">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-accent-strong)]">
          Criar conta
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[#fbfaf7] p-4 text-xs text-[var(--color-muted)]">
        Use os acessos seed para explorar os perfis. Veja o README para e-mails e senha.
      </div>
    </div>
  );
}
