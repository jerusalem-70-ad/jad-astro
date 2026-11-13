<script lang="ts">
import FilterList from "@/components/search/filter.svelte";
import FilterListId from "@/components/search/filter-id.svelte";
import FilterConnectedness from "@/components/search/filter-connectedness.svelte";
import { filters } from "@/stores/jad_store.js";

import { runSearch, fetchOwnFacets } from "@/lib/search/typsense-search.js";

import Info from '@lucide/svelte/icons/info';
import X from '@lucide/svelte/icons/x';

import type { Filters, ListKey, OperatorKey } from "@/types/store";

type FacetCount = { value: string; count: number };
type FacetResponse =
  | { facet_counts?: { field_name: string; counts: FacetCount[] }[] }
  | null
  | undefined;

type CountMap = Record<string, number>;

// Cast once, in one place, instead of at every use


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
let allClusters: FacetItem[] = [];

let authorCounts: CountMap = {};
let workCounts: CountMap = {};
let genreCounts: CountMap = {};
let keywordCounts: CountMap = {};
let placeCounts: CountMap = {};
let centuryCounts: CountMap = {};
let litRefCounts: CountMap = {};
let biblRefCounts: CountMap = {};
let manuscriptCounts: CountMap = {};
let clusterCounts: CountMap = {};

let searchToken = 0;


//helpers

function getFacet(response: FacetResponse, name: string): FacetCount[] {
  return response?.facet_counts?.find((f) => f.field_name === name)?.counts ?? [];
}

// Master list: filled once, then kept as it is
function master(current: FacetItem[], response: FacetResponse, name: string): FacetItem[] {
  if (current.length > 0) return current;
  return getFacet(response, name)
    .map((c) => ({ name: c.value, count: c.count }))
    .sort((a, b) => b.count - a.count);
}
 
// async function to start typsense query
async function updateSearch(currentFilters : Filters) {

  const token = ++searchToken;

  // main search (updates graph ids)
  const res = await runSearch(currentFilters);

  if (token !== searchToken || !res) return;

// 2) extra facet queries, only for OR / NOT fields that have selected values
  const own = await fetchOwnFacets(currentFilters);
  if (token !== searchToken) return;

 // Own facets if this field has them, otherwise the main response
  const countsFor = (key: ListKey, name: string): CountMap =>
    Object.fromEntries(
      (own[key] ?? getFacet(res, name)).map((c) => [c.value, c.count])
    );

 // ---------- MASTER LISTS ----------
  allAuthors     = master(allAuthors, res, "work.author.name");
  allWorks       = master(allWorks, res, "work.title");
  allGenres      = master(allGenres, res, "work.genre");
  allKeywords    = master(allKeywords, res, "keywords");
  allClusters    = master(allClusters, res, "cluster");
  allPlace       = master(allPlace, res, "work.author.place.value");
  allCentury     = master(allCentury, res, "work.date.century");
  allLitRef      = master(allLitRef, res, "liturgical_references");
  allBiblRef     = master(allBiblRef, res, "biblical_ref_lvl0");
  allManuscripts = master(allManuscripts, res, "manuscripts");

  // ---------- DYNAMIC COUNTS ----------
  authorCounts     = countsFor("authors", "work.author.name");
  workCounts       = countsFor("works", "work.title");
  genreCounts      = countsFor("genres", "work.genre");
  keywordCounts    = countsFor("keywords", "keywords");
  clusterCounts    = countsFor("clusters", "cluster");
  placeCounts      = countsFor("place", "work.author.place.value");
  centuryCounts    = countsFor("century", "work.date.century");
  litRefCounts     = countsFor("lit_ref", "liturgical_references");
  biblRefCounts    = countsFor("bibl_ref", "biblical_ref_lvl0");
  manuscriptCounts = countsFor("manuscripts", "manuscripts");
}

// whenever filters change (store), start a new Typesense query
$: updateSearch($filters);
</script>
<div class="space-y-2">
 <!-- Replaces the old <button id="filter-info"> and the whole <dialog> -->

<button
  id="filter-info"
  type="button"
  popovertarget="filter-info-popover"
  class="flex w-full cursor-help gap-2 justify-center items-center py-2 text-lg font-bold border border-neutral-200 shadow-xs rounded-md p-2 bg-brand-400 text-white [anchor-name:--filter-info]"
>
  <h2>How to</h2>
  <Info></Info>
</button>

<div
  popover
  id="filter-info-popover"
  class="m-0 mt-1 inset-auto w-xl max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-md border border-brand-600 bg-white p-0 shadow-lg
         [position-anchor:--filter-info] [position-area:bottom_span-right] [position-try-fallbacks:flip-block,flip-inline]"
>
  <h1 class="font-semibold text-lg bg-brand-600/90 text-white p-5 prose">How to use the filters?</h1>

  <div class="prose p-5">
    <p>Use the filters in the <strong>aside panel</strong> to refine the corpus and display only the passages matching your criteria.</p>

    <ul class="list-disc">
      <li><strong>Combine filters</strong> to narrow your results.</li>
      <li>
        Most filter panels let you select the <strong>search mode</strong> using the buttons:
        <ul>
          <li><strong>OR</strong> - displays results matching <strong>at least one</strong> of the selected filter values.</li>
          <li><strong>AND</strong> - displays results matching <strong>all</strong> selected filter values.</li>
          <li><strong>NOT</strong> - displays results <strong>excluding</strong> all selected filter values.</li>
        </ul>
      </li>
    </ul>

    <p>
      Example: Under <strong>KEYWORDS</strong>, selecting <i>Anti-Judaism</i> and <i>Typology</i> with <strong>AND</strong> displays passages containing both keywords.
      Using <strong>OR</strong> displays passages containing either <i>Anti-Judaism</i> or <i>Typology</i> or both.
      Using <strong>NOT</strong> displays passages containing neither of the keywords.
    </p>

    <p>The visualisations update instantly as filters are applied.</p>

    <button
      type="button"
      popovertarget="filter-info-popover"
      popovertargetaction="hide"
      aria-label="Close"
      class="inline-flex items-center font-semibold mt-4 cursor-pointer rounded-md bg-brand-600/90 px-4 py-2 text-lg text-white hover:bg-brand-500"
    >
      Close <X></X>
    </button>
  </div>
</div>
 

   <div class="space-y-4">
    <FilterListId
      title="Passage ID"
      field="rec_id"
       />
     <FilterList
      title="Authors"
      field="authors"
      items={allAuthors}
      counts={authorCounts}
      operatorMode={false}
       />
     
       <FilterList
      title="Works"
      field="works"
      items={allWorks}
      operatorMode={false}
      counts={workCounts}
       />
      <FilterList
          title="Genres"
          field="genres"
          items={allGenres}
          counts={genreCounts}
      operatorMode={false}

      />
      <FilterList
          title="Keywords"
          items={allKeywords}
          field="keywords"
          counts={keywordCounts}
      />
       <FilterList
          title="Clusters"
          items={allClusters}
          field="clusters"
          counts={clusterCounts}
          help="Passages are thematically analysed and grouped in clusters."
      />
      <FilterList
          title="Place"
          items={allPlace}
          field="place"
      operatorMode={false}
          counts={placeCounts}
      help="Place where the work was written."

      />
      <FilterList
          title="Century"
          items={allCentury}
          field="century"
          counts={centuryCounts}
        help="Century when the work was written."
     
      />
      <FilterList
          title="Liturgical References"
          items={allLitRef}
          field="lit_ref"
          counts={litRefCounts}
        help="References to liturgical feasts detected in the passages."

      />
      <FilterList
          title="Biblical References"
          items={allBiblRef}
          field="bibl_ref"
          counts={biblRefCounts}
        help="References to Biblical texts detected in the passages."

      />
      <FilterList
          title="Manuscripts"
          items={allManuscripts}
          field="manuscripts"
          counts={manuscriptCounts}
          help="Manuscripts containing the passages."

      />
      <FilterConnectedness
        title="Connectedness"
        field="connectedness"
        help="Number of related passages (i.e. sources or derivates)."
        />
   </div>
  
</div>