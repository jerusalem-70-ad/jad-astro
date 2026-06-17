<script lang="ts">
import FilterList from "@/components/search/filter.svelte";
import { filters, defaultFilters } from "@/stores/jad_store.js";

import {
  runSearch,
  searchTypesense,
  removeFilter,
  FIELD_MAP
} from "@/lib/search/typsense-search.js";

function resetFilters() {
  filters.set(structuredClone(defaultFilters));
}
interface FacetItem {
  name: string;
  count: number;
}

let allAuthors: FacetItem[] = [];
let allWorks: FacetItem[] = [];
let allGenres: FacetItem[] = [];
let allKeywords: FacetItem[] = [];
let allPlace: FacetItem[] = [];
let allCentury: FacetItem[] = [];
let allLitRef: FacetItem[] = [];
let allBiblRef: FacetItem[] = [];
let allManuscripts: FacetItem[] = [];

let authorCounts = {};
let workCounts = {};
let genreCounts = {};
let keywordCounts = {};
let placeCounts = {};
let centuryCounts = {};
let litRefCounts = {};
let biblRefCounts = {};
let manuscriptCounts = {};

let searchToken = 0;

 $: activeFilters = Object.entries($filters)
    .filter(([key, value]) =>
      key !== "operators" &&
      key !== "query" &&
      Array.isArray(value) &&
      value.length > 0
    );
// async function to start typsense query
async function updateSearch(currentFilters) {

  const token = ++searchToken;

  // main search (updates graph ids)
  const res = await runSearch(currentFilters);

  if (token !== searchToken || !res) return;

  // facet responses
 const facetResponses = {};

// default: use main response
for (const field of Object.keys(FIELD_MAP)) {
  facetResponses[field] = res;
}

// build only the queries we actually need
const facetPromises = Object.keys(FIELD_MAP)
  .filter(field => {
    const operator =
      currentFilters.operators?.[field] ?? "OR";

    return (
      operator === "OR" &&
      (currentFilters[field]?.length ?? 0) > 0
    );
  })
  .map(async field => {

    const facetResult = await searchTypesense(
      removeFilter(currentFilters, field)
    );

    return {
      field,
      response: facetResult?.response ?? res
    };
  });

const facetResults = await Promise.all(facetPromises);

for (const { field, response } of facetResults) {
  facetResponses[field] = response;
}

  if (token !== searchToken) return;

  function getFacet(response, name) {
    const facets = response?.facet_counts ?? [];

    return (
      facets.find(f => f.field_name === name)?.counts
      ?? []
    );
  }

  function mapFacet(response, name) {
    return getFacet(response, name).map(c => ({
      name: c.value,
      count: c.count
    }));
  }

  function facetCountsFrom(response, name) {
    return Object.fromEntries(
      getFacet(response, name).map(c => [
        c.value,
        c.count
      ])
    );
  }

  // ---------- MASTER LISTS ----------

  if (allAuthors.length === 0) {
    allAuthors = mapFacet(
      res,
      "work.author.name"
    ).sort((a, b) => b.count - a.count);
  }

  if (allWorks.length === 0) {
    allWorks = mapFacet(
      res,
      "work.title"
    ).sort((a, b) => b.count - a.count);
  }

  if (allGenres.length === 0) {
    allGenres = mapFacet(
      res,
      "work.genre"
    ).sort((a, b) => b.count - a.count);
  }

  if (allKeywords.length === 0) {
    allKeywords = mapFacet(
      res,
      "keywords.label"
    ).sort((a, b) => b.count - a.count);
  }

  if (allPlace.length === 0) {
    allPlace = mapFacet(
      res,
      "work.author.place.value"
    ).sort((a, b) => b.count - a.count);
  }

  if (allCentury.length === 0) {
    allCentury = mapFacet(
      res,
      "work.date.century"
    ).sort((a, b) => b.count - a.count);
  }

  if (allLitRef.length === 0) {
    allLitRef = mapFacet(
      res,
      "liturgical_references.value"
    ).sort((a, b) => b.count - a.count);
  }

  if (allBiblRef.length === 0) {
    allBiblRef = mapFacet(
      res,
      "biblical_ref_lvl0"
    ).sort((a, b) => b.count - a.count);
  }

  if (allManuscripts.length === 0) {
    allManuscripts = mapFacet(
      res,
      "manuscripts.manuscript"
    ).sort((a, b) => b.count - a.count);
  }

  // ---------- DYNAMIC COUNTS ----------

  authorCounts = facetCountsFrom(
    facetResponses.authors,
    "work.author.name"
  );

  workCounts = facetCountsFrom(
    facetResponses.works,
    "work.title"
  );

  genreCounts = facetCountsFrom(
    facetResponses.genres,
    "work.genre"
  );

  keywordCounts = facetCountsFrom(
    facetResponses.keywords,
    "keywords.label"
  );

  placeCounts = facetCountsFrom(
    facetResponses.place,
    "work.author.place.value"
  );

  centuryCounts = facetCountsFrom(
    facetResponses.century,
    "work.date.century"
  );

  litRefCounts = facetCountsFrom(
    facetResponses.lit_ref,
    "liturgical_references.value"
  );

  biblRefCounts = facetCountsFrom(
    facetResponses.bibl_ref,
    "biblical_ref_lvl0"
  );

  manuscriptCounts = facetCountsFrom(
    facetResponses.manuscripts,
    "manuscripts.manuscript"
  );
}


// whenever filters change (we get then from store, where the filter components write)
// start a new typsense query
$: updateSearch($filters);


</script>

<div class="space-y-3  ">

  <h2 class="text-lg font-bold">Filters</h2>
  
   <div class="space-y-4">
     <FilterList
      title="Authors"
      field="authors"
      items={allAuthors}
      counts={authorCounts}
       />
     
       <FilterList
      title="Works"
      field="works"
      items={allWorks}
      counts={workCounts}
       />
      <FilterList
          title="Genres"
          field="genres"
          items={allGenres}
          counts={genreCounts}
      />
      <FilterList
          title="Keywords"
          items={allKeywords}
          field="keywords"
          counts={keywordCounts}
      />
      <FilterList
          title="Place"
          items={allPlace}
          field="place"
          counts={placeCounts}
      />
      <FilterList
          title="Century"
          items={allCentury}
          field="century"
          counts={centuryCounts}
     
      />
      <FilterList
          title="Liturgical References"
          items={allLitRef}
          field="lit_ref"
          counts={litRefCounts}
      />
      <FilterList
          title="Biblical References"
          items={allBiblRef}
          field="bibl_ref"
          counts={biblRefCounts}
      />
      <FilterList
          title="Manuscripts"
          items={allManuscripts}
          field="manuscripts"
          counts={manuscriptCounts}
      />
   </div>
   {#if activeFilters.length}
   <div class="text-xs border border-neutral-200 shadow-xs rounded-md p-2 bg-brand-400 text-white">
    <h2 class="text-base font-semibold ">Current filters:</h2>
    <ul class="space-y-1">
      {#each activeFilters as [field, values]}
        <li class="bg-white text-brand-900 rounded-md px-1 py-0.5">
          <strong>{field}:</strong> {values.join(" || ")}
        </li>
      {/each}
    </ul>   
  </div>
  <button id="reset-filters" 
   class="cursor-pointer w-full bg-brand-600 hover:bg-brand-500 text-white font-bold border border-neutral-200 shadow-xs rounded-md p-2"
   on:click={resetFilters}>Reset</button>
{/if}
</div>