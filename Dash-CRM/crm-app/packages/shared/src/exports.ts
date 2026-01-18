export const exportFormatValues = ["CSV", "XLSX"] as const;
export type ExportFormat = typeof exportFormatValues[number];

export const exportTypeValues = [
  "crm:companies",
  "crm:contacts",
  "crm:deals",
  "crm:activities",
  "support:tickets",
  "marketing:campaigns",
  "marketing:attribution",
  "cs:accounts",
  "cs:renewals",
  "audit:logs",
] as const;
export type ExportType = typeof exportTypeValues[number];

export type ExportRequestDTO = {
  type: ExportType;
  format: ExportFormat;
  filters?: Record<string, string | number | boolean | undefined>;
};
