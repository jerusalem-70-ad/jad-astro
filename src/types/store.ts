export type FilterOperator = "AND" | "OR";

export interface Filters {
  authors: string[];
  works: string[];
  genres: string[];
  keywords: string[];
  place: string[];
  century: string[];
  lit_ref: string[];
  bibl_ref: string[];
  manuscripts: string[];

  query: string;

  operators: {
    authors: FilterOperator;
    works: FilterOperator;
    genres: FilterOperator;
    keywords: FilterOperator;
    place: FilterOperator;
    century: FilterOperator;
    lit_ref: FilterOperator;
    bibl_ref: FilterOperator;
    manuscripts: FilterOperator;
  };
}
