type DiffResult = Record<string, { from?: string | number | null; to?: string | number | null }>;

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return value as string | number | null;
};

export const buildDiff = (before: Record<string, unknown>, after: Record<string, unknown>, fields: string[]) => {
  const diff: DiffResult = {};

  fields.forEach((field) => {
    const previous = normalizeValue(before[field]);
    const next = normalizeValue(after[field]);
    if (previous !== next) {
      diff[field] = { from: previous, to: next };
    }
  });

  return diff;
};
