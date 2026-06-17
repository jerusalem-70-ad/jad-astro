import { filteredIds } from "@/stores/jad_store.ts";
import { createTypesenseClient } from "@/lib/search/create-typesense-client.js";

const client = createTypesenseClient();

let currentSearchToken = 0;

export const FIELD_MAP = {
  authors: "work.author.name",
  works: "work.title",
  genres: "work.genre",
  keywords: "keywords.label",
  place: "work.author.place.value",
  century: "work.date.century",
  lit_ref: "liturgical_references.value",
  bibl_ref: "biblical_ref_lvl0",
  manuscripts: "manuscripts.manuscript",
};

const FACET_FIELDS =
  "work.author.name, work.title, work.genre, keywords.label, work.author.place.value, work.date.century, biblical_ref_lvl0, liturgical_references.value, manuscripts.manuscript";

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
 * Safe to use for facet calculations.
 */
export async function searchTypesense(filters) {
  const token = ++currentSearchToken;

  try {
    const filter_by = buildFilterBy(filters);

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
 * Useful when computing OR-facet counts.
 */
export function removeFilter(filters, field) {
  return {
    ...filters,
    [field]: [],
  };
}

function escapeFilterValue(value) {
  return `\`${String(value).replace(/`/g, "\\`")}\``;
}

function buildFilterBy(filters) {
  const clauses = [];

  for (const [key, fieldName] of Object.entries(FIELD_MAP)) {
    const values = filters[key] ?? [];

    if (!values.length) continue;

    const operator = filters.operators?.[key] ?? "OR";

    if (operator === "OR") {
      clauses.push(
        `${fieldName}:=[${values.map(escapeFilterValue).join(",")}]`,
      );
    } else {
      clauses.push(
        values.map((v) => `${fieldName}:=${escapeFilterValue(v)}`).join(" && "),
      );
    }
  }

  return clauses.length ? clauses.join(" && ") : undefined;
}
