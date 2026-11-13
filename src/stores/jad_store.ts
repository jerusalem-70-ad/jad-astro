import { writable } from "svelte/store";
import type { Filters, OperatorKey } from "@/types/store";

import type { GraphNode, GraphLink } from "@/types/index";

export const selectedJadId = writable<string | null>(null);
export const filteredIds = writable<Set<string>>(new Set());
export const dataPassagesGraph = writable<{
  nodes: GraphNode[];
  links: GraphLink[];
}>({
  nodes: [],
  links: [],
});

export const defaultFilters: Filters = {
  authors: [],
  works: [],
  genres: [],
  keywords: [],
  place: [],
  century: [],
  lit_ref: [],
  bibl_ref: [],
  manuscripts: [],
  rec_id: [],
  clusters: [],
  query: "",
  operators: {
    authors: "OR",
    works: "OR",
    genres: "OR",
    keywords: "OR",
    place: "OR",
    century: "OR",
    lit_ref: "OR",
    bibl_ref: "OR",
    manuscripts: "OR",
    clusters: "OR",
  },
  excludes: {
    authors: false,
    works: false,
    genres: false,
    keywords: false,
    place: false,
    century: false,
    lit_ref: false,
    bibl_ref: false,
    manuscripts: false,
    clusters: false,
  },
};

export const filters = writable<Filters>(structuredClone(defaultFilters));

// Helper so components don't have to touch the store shape directly
export function setExclude(key: OperatorKey, value: boolean) {
  filters.update((f) => ({
    ...f,
    excludes: { ...f.excludes, [key]: value },
  }));
}

//in dashboard we show only one visualization in the center, the other as cards on the right
export const selectedViz = writable<string>("timeline");
