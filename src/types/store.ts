import { writable } from "svelte/store";

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
  rec_id: string[];
  clusters: string[];

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
    clusters: FilterOperator;
  };
}

export type ListKey = {
  [K in keyof Filters]: Filters[K] extends string[] ? K : never;
}[keyof Filters];

export type OperatorKey = keyof Filters["operators"];
import type { Graph } from "@/types/index";

export const selectedJadId = writable<string | null>(null);
export const filteredIds = writable<Set<string>>(new Set());
export const dataPassagesGraph = writable<Graph>({ nodes: [], links: [] });
