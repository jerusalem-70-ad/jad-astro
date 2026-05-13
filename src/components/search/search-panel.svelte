<script lang="ts">
import FilterList from "@/components/search/filter.svelte";
import { filters } from "@/stores/jad_store.js";
import { runSearch } from "@/lib/search/typsense-search.js";

let allAuthors = [];
let allWorks = [];
let allGenres = [];
let allKeywords = [];
let allPlace = [];
let allCentury = [];
let allLitRef = [];
let allBiblRef = [];
let allManuscripts = [];

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
// async function to start typsense query
async function updateSearch(currentFilters: any) {

  const token = ++searchToken;  // to avoid queries overlapping

  const res = await runSearch(currentFilters);
    console.log(res)
  // ignore stale responses
  if (token !== searchToken || !res) return; // if this is not the most recent query, abort

  const facets = res.facet_counts ?? []; // take the facets list and counts from typsense
  const getFacet = (name: string) =>
  facets.find(f => f.field_name === name)?.counts ?? [];
  //prepare the data for filter list from the typsense response on facets
function mapFacet(name) {
  return getFacet(name).map(c => ({
    name: c.value,
    count: c.count
  }));
}

function facetCounts(name) {
  return Object.fromEntries(
    getFacet(name).map(c => [c.value, c.count])
  );
}
// ---------- MASTER LISTS (only once) ----------

if (allAuthors.length === 0) {
  allAuthors = mapFacet("work.author.name")
    .sort((a,b) => b.count - a.count);
}

if (allWorks.length === 0) {
  allWorks = mapFacet("work.title")
    .sort((a,b) => b.count - a.count);
}

if (allGenres.length === 0) {
  allGenres = mapFacet("work.genre")
    .sort((a,b) => b.count - a.count);
}

if (allKeywords.length === 0) {
  allKeywords = mapFacet("keywords.value")
    .sort((a,b) => b.count - a.count);
}

if (allPlace.length === 0) {
  allPlace = mapFacet("work.author.place.value")
    .sort((a,b) => b.count - a.count);
}

if (allCentury.length === 0) {
  allCentury = mapFacet("work.date.century")
    .sort((a,b) => b.count - a.count);
}

if (allLitRef.length === 0) {
  allLitRef = mapFacet("liturgical_references.value")
    .sort((a,b) => b.count - a.count);
}

if (allBiblRef.length === 0) {
  allBiblRef = mapFacet("biblical_ref_lvl0")
    .sort((a,b) => b.count - a.count);
}

if (allManuscripts.length === 0) {
  allManuscripts = mapFacet("manuscripts.manuscript")
    .sort((a,b) => b.count - a.count);
}


// ---------- DYNAMIC COUNTS ----------

authorCounts = facetCounts("work.author.name");

workCounts = facetCounts("work.title");

genreCounts = facetCounts("work.genre");

keywordCounts = facetCounts("keywords.value");

placeCounts = facetCounts("work.author.place.value");

centuryCounts = facetCounts("work.date.century");

litRefCounts = facetCounts("liturgical_references.value");

biblRefCounts = facetCounts("biblical_ref_lvl0");

manuscriptCounts = facetCounts("manuscripts.manuscript");
}


// whenever filters change (we get then from store, where the filter components write)
// start a new typsense query
$: updateSearch($filters);


</script>

<div class="search-panel space-y-4  ">

            <h2 class="text-lg font-bold">Filters</h2>
  
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