import { AuthGate } from "../../components/layout/AuthGate";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-[var(--color-shell)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(36,199,218,0.12),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.8),transparent_40%)]" />
        <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-3xl rounded-3xl border border-[var(--color-border)] bg-white/95 p-8 shadow-[0_30px_60px_rgba(15,18,22,0.12)] backdrop-blur">
            {children}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
