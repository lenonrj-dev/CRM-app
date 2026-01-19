import { getTokens } from "../../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api";

export type ExportPayload = {
  type: string;
  format: "CSV" | "XLSX";
  filters?: Record<string, string | number | boolean | undefined>;
};

const buildFilename = (type: string, format: string) =>
  `${type.replace(":", "-")}-${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;

export const downloadExport = async (payload: ExportPayload) => {
  const tokens = getTokens();
  const response = await fetch(`${API_URL}/exports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message ?? "Falha ao exportar");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildFilename(payload.type, payload.format);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
