import { writable } from "svelte/store";

export const selectedJadId = writable(null);

export const filters = writable({
  authors: [],
  works: [],
  genres: [],
  keywords: [],
  place: [],
  query: "",
});

export const filteredIds = writable(new Set());
