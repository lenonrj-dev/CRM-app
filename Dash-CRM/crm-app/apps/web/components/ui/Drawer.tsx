import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <aside className="relative ml-auto h-full w-full max-w-lg bg-white shadow-[0_30px_80px_rgba(15,18,22,0.2)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar painel">
            <X size={18} />
          </Button>
        </div>
        <div className="h-[calc(100%-72px)] overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  );
}
