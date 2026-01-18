export type SearchResultItem = {
  id: string;
  type: "company" | "contact" | "deal" | "ticket";
  title: string;
  subtitle?: string;
};

export type SearchResultGroup = {
  type: SearchResultItem["type"];
  items: SearchResultItem[];
};
