import { writable } from "svelte/store";
import type { Filters } from "@/types/store";

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
};

export const filters = writable<Filters>(structuredClone(defaultFilters));

//in dashboard we show only one visualization in the center, the other as cards on the right
export const selectedViz = writable<string>("timeline");
