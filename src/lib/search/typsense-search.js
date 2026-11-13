import { filteredIds } from "@/stores/jad_store.ts";
import { createTypesenseClient } from "@/lib/search/create-typesense-client.js";

const client = createTypesenseClient();

let currentSearchToken = 0;

export const FIELD_MAP = {
  rec_id: "rec_id",
  connectedness: "connectedness",
  authors: "work.author.name",
  works: "work.title",
  genres: "work.genre",
  keywords: "keywords",
  clusters: "cluster",
  place: "work.author.place.value",
  century: "work.date.century",
  lit_ref: "liturgical_references",
  bibl_ref: "biblical_ref_lvl0",
  manuscripts: "manuscripts",
};

const FACET_FIELDS =
  "connectedness, rec_id, work.author.name, work.title, work.genre, keywords, cluster, work.author.place.value, work.date.century, biblical_ref_lvl0, liturgical_references, manuscripts";

// unlike the other fields connectedness is a number
const NUMERIC_FIELDS = new Set(["connectedness"]);

/**
 * Main search used for results + graph updates
 */
export async function runSearch(filters) {
  const result = await searchTypesense(filters);

  if (!result) return null;

  filteredIds.set(new Set(result.ids));

  return result.response;
}

/**
 * Raw Typesense search.
 * Does NOT update stores.
 * Uses the stale-query token, so do not call it in parallel
 * with other searches (use fetchFacetsWithout for facets).
 */
export async function searchTypesense(filters, allowedIds = []) {
  const token = ++currentSearchToken;

  try {
    const filter_by = buildFilterBy(filters, allowedIds);

    let page = 1;
    let found = 0;
    let firstRes = null;
    let allIds = [];

    do {
      const res = await client.collections("JAD-temp").documents().search({
        q: "*",
        query_by: "search_text",
        filter_by,
        facet_by: FACET_FIELDS,
        max_facet_values: 500,
        per_page: 250,
        page,
        include_fields: "id",
      });

      // stale query protection
      if (token !== currentSearchToken) return null;

      if (page === 1) {
        found = res.found ?? 0;
        firstRes = res;
      }

      const hits = res.hits ?? [];

      allIds.push(...hits.map((h) => h.document.id));

      page++;
    } while (allIds.length < found);

    return {
      response: firstRes,
      ids: allIds,
    };
  } catch (err) {
    console.error("Typesense search error:", err);
    return null;
  }
}

/**
 * Remove a filter completely.
 * Useful when computing OR/NOT facet counts.
 */
export function removeFilter(filters, field) {
  return {
    ...filters,
    [field]: [],
  };
}

/**
 * Facet counts for ONE field, ignoring that field's own filter.
 * Does not use currentSearchToken, so it never cancels the main search.
 * Returns [{ value, count }, ...]
 */
export async function fetchFacetsWithout(filters, key) {
  const fieldName = FIELD_MAP[key];
  const filter_by = buildFilterBy(removeFilter(filters, key));

  try {
    const res = await client.collections("JAD-temp").documents().search({
      q: "*",
      query_by: "search_text",
      filter_by,
      facet_by: fieldName,
      max_facet_values: 500,
      per_page: 0, // counts only, no documents
    });

    const facet = res.facet_counts?.find((f) => f.field_name === fieldName);
    return facet?.counts ?? [];
  } catch (err) {
    console.error("Typesense facet error:", err);
    return [];
  }
}

/**
 * Finds every field that needs its own facet query (it has selected
 * values AND is in OR or NOT mode) and fetches them all in parallel.
 * Returns an object like: { place: [{ value, count }, ...], ... }
 * Fields not in the result can use the facets from the main response.
 */
export async function fetchOwnFacets(filters) {
  const keys = Object.keys(FIELD_MAP).filter((key) => {
    if (NUMERIC_FIELDS.has(key)) return false;

    const hasValues = (filters[key] ?? []).length > 0;
    const isOr = (filters.operators?.[key] ?? "OR") === "OR";
    const isExcluded = filters.excludes?.[key] ?? false;

    return hasValues && (isOr || isExcluded);
  });

  const results = await Promise.all(
    keys.map((key) => fetchFacetsWithout(filters, key)),
  );

  return Object.fromEntries(keys.map((key, i) => [key, results[i]]));
}

function escapeFilterValue(value) {
  return `\`${String(value).replace(/`/g, "\\`")}\``;
}

function buildFilterBy(filters, allowedIds = []) {
  const clauses = [];

  if (allowedIds.length > 0) {
    clauses.push(`id:=[${allowedIds.map(escapeFilterValue).join(",")}]`);
  }

  for (const [key, fieldName] of Object.entries(FIELD_MAP)) {
    const values = filters[key] ?? [];
    if (!values.length) continue;

    // connectedness is a special case: "at least N"
    if (key === "connectedness") {
      clauses.push(`${fieldName}:>=${Number(values[0])}`);
      continue;
    }

    const operator = filters.operators?.[key] ?? "OR";
    const exclude = filters.excludes?.[key] ?? false;
    const isNumeric = NUMERIC_FIELDS.has(key);

    // Format values once: numbers stay plain, strings get backticks
    const formatted = values.map((v) =>
      isNumeric ? Number(v) : escapeFilterValue(v),
    );

    // 1) NEGATION: field must NOT be any of these values
    if (exclude) {
      clauses.push(`${fieldName}:!=[${formatted.join(",")}]`);
      continue;
    }

    // 2) OR: field matches ANY of the values
    if (operator === "OR") {
      clauses.push(`${fieldName}:=[${formatted.join(",")}]`);
      continue;
    }

    // 3) AND: field must match ALL values (one condition per value)
    clauses.push(formatted.map((v) => `${fieldName}:=${v}`).join(" && "));
  }

  return clauses.length ? clauses.join(" && ") : undefined;
}
