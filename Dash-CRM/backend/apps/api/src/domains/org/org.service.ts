import { randomBytes } from "crypto";
import { Organization } from "../auth/organization.model";

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildOrgSlug = (value: string) => {
  const slug = normalize(value);
  return slug || `org-${randomBytes(3).toString("hex")}`;
};

export const resolveOrgSlug = async (value: string, orgId?: string) => {
  const base = buildOrgSlug(value);
  let candidate = base;
  let counter = 1;
  const filter = orgId ? { _id: { $ne: orgId } } : {};

  while (await Organization.exists({ slug: candidate, ...filter })) {
    if (counter > 8) {
      candidate = `${base}-${randomBytes(2).toString("hex")}`;
      break;
    }
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
};
