import { writable } from "svelte/store";

export const selectedJadId = writable(null);

export const filters = writable({
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
});

export const filteredIds = writable(new Set());

export const dataPassagesGraph = writable({
  nodes: [],
  links: [],
});
