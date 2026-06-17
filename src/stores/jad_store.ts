import { writable } from "svelte/store";
import type { Filters } from "@/types/store";

export const selectedJadId = writable(null);

export const filteredIds = writable(new Set());

export const dataPassagesGraph = writable({
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
  },
};

export const filters = writable<Filters>(structuredClone(defaultFilters));
