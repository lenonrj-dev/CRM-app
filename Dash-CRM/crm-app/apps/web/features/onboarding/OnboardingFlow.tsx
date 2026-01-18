"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../auth/auth-context";
import { createCompany } from "../crm/companies/api";
import { createContact } from "../crm/contacts/api";
import { loadDemoData, updateOnboarding } from "./api";

const timezones = ["America/Sao_Paulo", "America/Recife", "America/Manaus"];

export function OnboardingFlow() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState(user?.organization?.name ?? "");
  const [currency, setCurrency] = useState(user?.organization?.currency ?? "BRL");
  const [timezone, setTimezone] = useState(user?.organization?.timezone ?? "America/Sao_Paulo");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      { title: "Organização", subtitle: "Defina o nome que o time verá no CRM" },
      { title: "Preferências", subtitle: "Ajuste moeda e fuso horário" },
      { title: "Primeiros dados", subtitle: "Crie sua primeira conta ou carregue um demo" },
    ],
    [],
  );

  useEffect(() => {
    if (user?.organization?.onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleNext = async () => {
    setError(null);
    setLoading(true);
    try {
      if (step === 0) {
        await updateOnboarding({ orgName });
        await refreshUser();
      }
      if (step === 1) {
        await updateOnboarding({ currency, timezone });
        await refreshUser();
      }
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setError(null);
    setLoading(true);
    try {
      if (companyName.trim()) {
        const company = await createCompany({ name: companyName });
        if (contactEmail.trim()) {
          const [firstName, ...rest] = contactName.trim().split(" ");
          const lastName = rest.join(" ") || "Contato";
          await createContact({
            firstName: firstName || "Contato",
            lastName,
            email: contactEmail,
            companyId: company.company.id,
          });
        }
      }
      await updateOnboarding({ onboardingCompleted: true });
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível finalizar o onboarding");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await loadDemoData();
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o demo");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setError(null);
    setLoading(true);
    try {
      await updateOnboarding({ onboardingCompleted: true });
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">Onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold">{steps[step].title}</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{steps[step].subtitle}</p>
        </div>
        <div className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--color-muted)]">
          Etapa {step + 1} de {steps.length}
        </div>
      </div>

      <div className="space-y-4">
        {step === 0 ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Nome da organização
            </label>
            <Input value={orgName} onChange={(event) => setOrgName(event.target.value)} required className="mt-2" />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Moeda</label>
              <Input value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Fuso horário</label>
              <select
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"
              >
                {timezones.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Empresa (opcional)
                </label>
                <Input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Nome do contato (opcional)
                </label>
                <Input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                E-mail do contato (opcional)
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="mt-2"
              />
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-4 text-sm text-[var(--color-muted)]">
              Prefira começar com dados de exemplo se quiser explorar todo o CRM rapidamente.
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={handleSkip} disabled={loading}>
          Pular por enquanto
        </Button>
        <div className="flex items-center gap-2">
          {step === 2 ? (
            <Button type="button" variant="secondary" onClick={handleLoadDemo} disabled={loading}>
              Carregar dados de exemplo
            </Button>
          ) : null}
          <Button type="button" onClick={step === 2 ? handleFinish : handleNext} disabled={loading}>
            {loading ? "Salvando..." : step === 2 ? "Finalizar" : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
