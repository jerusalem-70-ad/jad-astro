import { filteredIds } from "@/stores/jad_store.js";
import { createTypesenseClient } from "@/lib/search/create-typesense-client.js";

const client = createTypesenseClient();

let currentSearchToken = 0;

export async function runSearch(f) {
  const token = ++currentSearchToken;

  try {
    const filterParts = [
      f.authors.length ? `work.author.name:=[${f.authors.join(",")}]` : null,
      f.works.length ? `work.title:=[${f.works.join(",")}]` : null,
      f.genres.length ? `work.genre:=[${f.genres.join(",")}]` : null,
      f.keywords.length ? `keywords.value:=[${f.keywords.join(",")}]` : null,
      f.place.length ? `work.author.place.value:=[${f.place.join(",")}]` : null,
      f.century.length ? `work.date.century:=[${f.century.join(",")}]` : null,
      f.lit_ref.length
        ? `liturgical_references.value:=[${f.lit_ref.join(",")}]`
        : null,
      f.bibl_ref.length ? `biblical_ref_lvl0:=[${f.bibl_ref.join(",")}]` : null,
    ].filter(Boolean);

    const filter_by = filterParts.length ? filterParts.join(" && ") : undefined;

    let page = 1;
    let allIds = [];
    let found = 0;
    let firstRes = null;
    // need a loop - Typsense return max 250 hits per query, need more queries
    do {
      const res = await client.collections("JAD-temp").documents().search({
        q: "*",
        query_by: "search_text",
        filter_by,
        facet_by:
          "work.author.name, work.title, work.genre, keywords.value, work.author.place.value, work.date.century, biblical_ref_lvl0, liturgical_references.value",
        max_facet_values: 500,
        per_page: 250,
        page,
        include_fields: "id",
      });

      // cancel stale searches
      if (token !== currentSearchToken) return null;

      if (page === 1) {
        found = res.found ?? 0;
        firstRes = res;
      }

      const hits = res.hits ?? [];

      allIds.push(...hits.map((h) => h.document.id));

      page++;
    } while (allIds.length < found);

    // write the filtered ids in the store for the graph to update
    filteredIds.set(new Set(allIds));

    return firstRes;
  } catch (err) {
    console.error("Typesense search error:", err);
    return null;
  }
}
