const match = (value: string) => value.match(/^(\d+)([smhd])$/);

export const addDuration = (duration: string) => {
  const result = match(duration);
  if (!result) return new Date(Date.now() + 15 * 60 * 1000);
  const amount = Number(result[1]);
  const unit = result[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + amount * (multipliers[unit] ?? 0));
};
