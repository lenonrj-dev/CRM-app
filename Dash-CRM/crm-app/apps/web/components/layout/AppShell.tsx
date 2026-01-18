import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-shell)]">
      <Sidebar />
      <div className="lg:pl-72">
        <Topbar />
        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
