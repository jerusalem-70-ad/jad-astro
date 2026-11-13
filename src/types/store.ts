import { writable } from "svelte/store";

export type FilterOperator = "AND" | "OR";

// The fields that can have an operator / exclude flag
export type OperatorKey =
  | "authors"
  | "works"
  | "genres"
  | "keywords"
  | "place"
  | "century"
  | "lit_ref"
  | "bibl_ref"
  | "manuscripts"
  | "clusters";

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

  operators: Record<OperatorKey, FilterOperator>;

  // true = "NOT any of these values" for that field
  excludes: Record<OperatorKey, boolean>;
}
export type ListKey = {
  [K in keyof Filters]: Filters[K] extends string[] ? K : never;
}[keyof Filters];

import type { Graph } from "@/types/index";

export const selectedJadId = writable<string | null>(null);
export const filteredIds = writable<Set<string>>(new Set());
export const dataPassagesGraph = writable<Graph>({ nodes: [], links: [] });
