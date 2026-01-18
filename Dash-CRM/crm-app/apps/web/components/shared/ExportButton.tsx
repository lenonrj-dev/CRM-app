"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/Button";
import { downloadExport, type ExportPayload } from "../../features/exports/api";

export function ExportButton({
  type,
  label = "Exportar",
  filters,
}: {
  type: ExportPayload["type"];
  label?: string;
  filters?: ExportPayload["filters"];
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await downloadExport({ type, format: "CSV", filters });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} disabled={loading}>
      <Download size={16} />
      {loading ? "Exportando..." : label}
    </Button>
  );
}
