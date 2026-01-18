"use client";

import { useEffect, useState } from "react";
import type { SecurityPolicyDTO, SessionDTO, TwoFactorSetupDTO } from "@ateliux/shared";
import { PageHeader } from "../../../../components/shared/PageHeader";
import { RequirePermission } from "../../../../components/shared/RequirePermission";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import {
  disableTwoFactor,
  getSecurityPolicy,
  listSessions,
  revokeAllSessions,
  revokeSession,
  setupTwoFactor,
  updateSecurityPolicy,
  verifyTwoFactor,
} from "../../../../features/settings/security/api";
import { SessionsCard } from "../../../../features/settings/security/SessionsCard";
import { useAuth } from "../../../../features/auth/auth-context";
import { hasPermission } from "../../../../config/rbac";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<SecurityPolicyDTO | null>(null);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [setupData, setSetupData] = useState<TwoFactorSetupDTO | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const canWrite = hasPermission(user?.role, "security:write");

  const loadData = async () => {
    setLoading(true);
    try {
      const [policyData, sessionData] = await Promise.all([getSecurityPolicy(), listSessions()]);
      setPolicy(policyData.policy);
      setSessions(sessionData.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
  }, [user]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSetup = async () => {
    const data = await setupTwoFactor();
    setSetupData(data);
  };

  const handleVerify = async () => {
    if (!verifyCode) return;
    await verifyTwoFactor(verifyCode);
    setTwoFactorEnabled(true);
    setSetupData(null);
    setVerifyCode("");
  };

  const handleDisable = async () => {
    if (!disableCode) return;
    await disableTwoFactor(disableCode);
    setTwoFactorEnabled(false);
    setDisableCode("");
  };

  const handlePolicySave = async () => {
    if (!policy) return;
    const updated = await updateSecurityPolicy({
      password: policy.password,
      sessionTtlDays: policy.sessionTtlDays,
      requireTwoFactor: policy.requireTwoFactor,
      allowedOrigins: policy.allowedOrigins,
    });
    setPolicy(updated.policy);
  };

  return (
    <RequirePermission permission="security:read">
      <div className="space-y-6">
        <PageHeader title="Segurança" subtitle="Controle políticas de acesso, sessões e 2FA." />

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Autenticação em duas etapas</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Adicione uma verificação extra para proteger sua conta.
          </p>

          <div className="mt-4 space-y-3">
            <p className="text-sm">
              Status: <span className="font-semibold">{twoFactorEnabled ? "Ativado" : "Desativado"}</span>
            </p>
            {!twoFactorEnabled ? (
              <Button onClick={handleSetup} variant="secondary">
                Ativar 2FA
              </Button>
            ) : null}

            {setupData ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
                <p className="text-sm font-semibold">Escaneie o QR code</p>
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="QR do 2FA"
                  className="mt-3 h-40 w-40 rounded-xl bg-white p-2"
                />
                <p className="mt-4 text-xs text-[var(--color-muted)]">Códigos de backup</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {setupData.backupCodes.map((code) => (
                    <span key={code} className="rounded-full border border-[var(--color-border)] px-3 py-1">
                      {code}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    placeholder="Digite o código 2FA"
                    value={verifyCode}
                    onChange={(event) => setVerifyCode(event.target.value)}
                    className="w-48"
                  />
                  <Button onClick={handleVerify}>Verificar</Button>
                </div>
              </div>
            ) : null}

            {twoFactorEnabled ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Código para desativar"
                  value={disableCode}
                  onChange={(event) => setDisableCode(event.target.value)}
                  className="w-48"
                />
                <Button variant="ghost" onClick={handleDisable}>
                  Desativar 2FA
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Política de segurança</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Regras de senha e exigências de MFA da organização.
              </p>
            </div>
            {canWrite ? (
              <Button onClick={handlePolicySave} disabled={!policy}>
                Salvar política
              </Button>
            ) : null}
          </div>
          {policy ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Tamanho mínimo
                </label>
                <Input
                  type="number"
                  value={policy.password.minLength}
                  onChange={(event) =>
                    setPolicy({ ...policy, password: { ...policy.password, minLength: Number(event.target.value) } })
                  }
                  disabled={!canWrite}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  TTL de sessão (dias)
                </label>
                <Input
                  type="number"
                  value={policy.sessionTtlDays}
                  onChange={(event) => setPolicy({ ...policy, sessionTtlDays: Number(event.target.value) })}
                  disabled={!canWrite}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Exigir 2FA</label>
                <select
                  value={policy.requireTwoFactor ? "yes" : "no"}
                  onChange={(event) => setPolicy({ ...policy, requireTwoFactor: event.target.value === "yes" })}
                  disabled={!canWrite}
                  className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                >
                  <option value="no">Não</option>
                  <option value="yes">Sim</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Origens permitidas (separadas por vírgula)
                </label>
                <Input
                  value={policy.allowedOrigins?.join(", ") ?? ""}
                  onChange={(event) =>
                    setPolicy({
                      ...policy,
                      allowedOrigins: event.target.value
                        .split(",")
                        .map((origin) => origin.trim())
                        .filter(Boolean),
                    })
                  }
                  disabled={!canWrite}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              {loading ? "Carregando política..." : "Nenhuma política ainda."}
            </p>
          )}
        </Card>

        <SessionsCard
          sessions={sessions}
          loading={loading}
          onRevokeAll={() => revokeAllSessions().then(loadData)}
          onRevoke={(sessionId) => revokeSession(sessionId).then(loadData)}
        />
      </div>
    </RequirePermission>
  );
}
