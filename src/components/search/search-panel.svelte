<script lang="ts">
import FilterList from "@/components/search/filter.svelte";
import { filters } from "@/stores/jad_store.js";
import { runSearch } from "@/lib/search/typsense-search.js";

let authors : Array<{name: string, count: number}> = [];
let works : Array<{name: string, count: number}> = [];
let genres : Array<{name: string, count: number}> = [];
let keywords : Array<{name: string, count: number}> = [];
let place : Array<{name: string, count: number}> = [];
let century : Array<{name: string, count: number}> = [];
let lit_ref : Array<{name: string, count: number}> = [];
let bibl_ref : Array<{name: string, count: number}> = [];

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
  authors = getFacet("work.author.name").map(c => ({
      name: c.value,
      count: c.count
    })).sort((a,b) => b.count - a.count);
    
    works = getFacet("work.title").map(c => ({
        name: c.value,
        count: c.count
    })).sort((a,b) => b.count - a.count);

    genres = getFacet("work.genre").map(c => ({
        name: c.value,
        count: c.count
    }))

    keywords = getFacet("keywords.value").map(c => ({
        name: c.value,
        count: c.count
    }))

    place = getFacet("work.author.place.value").map(c => ({
        name: c.value,
        count: c.count
    }))
    century = getFacet("work.date.century").map(c => ({
        name: c.value,
        count: c.count
    }))
    lit_ref = getFacet("liturgical_references.value").map(c => ({
        name: c.value,
        count: c.count
    }))
    bibl_ref = getFacet("biblical_ref_lvl0").map(c => ({
        name: c.value,
        count: c.count
    }))
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
    items={authors}
  />

  <FilterList
    title="Works"
    field="works"
    items={works}
  />
    <FilterList
        title="Genres"
        field="genres"
        items={genres}
    />    

    <FilterList
        title="Keywords"
        items={keywords}
        field="keywords"
    />
    <FilterList
        title="Place"
        items={place}
        field="place"
    />
    <FilterList
        title="Century"
        items={century}
        field="century"
    />
    <FilterList
        title="Liturgical References"
        items={lit_ref}
        field="lit_ref"
    />
    <FilterList
        title="Biblical References"
        items={bibl_ref}
        field="bibl_ref"
    />
</div>