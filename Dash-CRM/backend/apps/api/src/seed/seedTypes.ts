export type SeedUsers = {
  owner: any;
  admin: any;
  manager: any;
  user: any;
  viewer: any;
  client: any;
  all: any[];
};

export type SeedContext = {
  org: any;
  users: SeedUsers;
  companies: any[];
  contacts: any[];
  deals: any[];
  activities: any[];
  tickets: any[];
};
