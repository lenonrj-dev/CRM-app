import type { Role, VisibilityScope } from "@ateliux/shared";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: Role;
      orgId: string;
      unitId?: string;
      teamIds?: string[];
      scope?: VisibilityScope;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
