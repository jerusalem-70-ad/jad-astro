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
  query: "",
});

export const filteredIds = writable(new Set());

export const dataPassagesGraph = writable({
  nodes: [],
  links: [],
});
