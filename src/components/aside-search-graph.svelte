<script>
  import { onMount } from "svelte";
  import instantsearch from "instantsearch.js";
  import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
  import {
    searchBox,
    infiniteHits,
    refinementList,
  } from "instantsearch.js/es/widgets";
  import { connectHits } from "instantsearch.js/es/connectors";

  import authorLookupMap from "@/content/data/authors_map.json";
  import { withBasePath } from "@/lib/withBasePath";
// svelte store to write the selected Jad id for the graph db to read and trigger the similarity search
  import { selectedJadId } from '@/stores/jad_store';

  
  export let enableGraph = false; 
  // set elements for the search,bind them later for reactivity
  let container;
  let searchbox;
  let refinementsAuthors;
  let refinementsWorks;
  let hits;

function createTypesenseUserClient() {
  const client = new Client({
    nodes: [
      {
        host: process.env.PUBLIC_TYPESENSE_API_HOST,
        port: process.env.PUBLIC_TYPESENSE_API_PORT,
        protocol: process.env.PUBLIC_TYPESENSE_API_PROTOCOL,
      },
    ],
    apiKey: "IA6BWzRrMo7yX3eFqgcFelJzhWkIl64W",
    connectionTimeoutSeconds: 2,
  });

  return client;
}

  async function fetchAllFilteredIds(filter_by) {

    const allIds = [];
    let page = 1;
    let found = 0;

    do {
      const res = await createTypesenseUserClient
        .collections("JAD-temp")
        .documents()
        .search({
          q: "*",
          query_by: "full_text",
          filter_by,
          page,
          per_page: 250
        });

      res.hits.forEach(h => allIds.push(h.document.id));

      found += res.hits.length;
      page++;

    } while(found < res.found);

    return allIds;
  }

  function initSearch() {
    const typesenseInstantsearchAdapter =
      new TypesenseInstantsearchAdapter({
        server: {
          apiKey: "IA6BWzRrMo7yX3eFqgcFelJzhWkIl64W",
          nodes: [
            {
              host: "typesense.acdh-dev.oeaw.ac.at",
              port: "443",
              protocol: "https",
            },
          ],
          // optional: if you’re in browser
    cacheSearchResultsForSeconds: 2,
        },
        additionalSearchParameters: {
          query_by: "full_text, search_text",
          query_by_weights: "2,1",
          sort_by: "sort_id:asc",
          per_page: 10,
        },
      });

    const search = instantsearch({
      searchClient: typesenseInstantsearchAdapter.searchClient,
      indexName: "JAD-temp",
    });

   const customHits = connectHits((renderOptions, isFirstRender) => {
      const { hits, results, widgetParams } = renderOptions;
      const { container } = widgetParams;

     

      if (isFirstRender) return;

      container.innerHTML = hits.map(hit => `
        <li class="py-1">
          <button
            class="text-start underline text-sm text-brand-700 hover:text-brand-500"
            data-id="${hit.id}"
          >
            (#${hit.id.substr(16)}) ${hit.work?.[0]?.title || "N/A"}
          </button>
        </li>
      `).join("");
    });


    search.addWidgets([
      searchBox({
        container: searchbox,
        placeholder: "",
      }),

    refinementList({
      container: refinementsAuthors,
      attribute: "author_search", // searching in the normalized field lower case no dashes
      searchable: true,
      showMore: true,
      showMoreLimit: 10,
      searchablePlaceholder: "",
      limit: 5,
      sortBy: ["name:asc"],
      // customized template to get the original names using authorLookupMap
      templates: {
        item: (item) => {
          const displayName = authorLookupMap[item.label] || item.label;
          const isRefined = item.isRefined ? "checked" : "";

          return `
            <label class="ais-RefinementList-label">
              <input
                type="checkbox"
                class="ais-RefinementList-checkbox"
                value="${item.value}"
                ${isRefined}
              />
              <span class="ais-RefinementList-labelText ml-1 text-sm">${displayName}</span>
            </label>
          `;
        },
      },
      cssClasses: {
        label: "flex items-center space-x-2",
        list: "text-sm text-neutral-700 m-1",
        showMore:
          "w-full text-sm text-brand-700 p-1 border border-brand-700 rounded mt-2 bg-orange-100 hover:bg-brand-700 hover:text-white transition",
        disableShowMore: "hidden",
        searchableInput:
          "w-full bg-white text-sm text-brand-700 p-1 border border-neutral-300 rounded",
        searchableSubmit: "bg-white",
      },
    }),

    refinementList({
      container: refinementsWorks,
      attribute: "work.title",
      searchable: true,
      showMore: true,
      showMoreLimit: 10,
      limit: 5,
      searchablePlaceholder: "",
      cssClasses: {
        label: "flex items-center space-x-2",
        searchableRoot: "w-full",
        list: "text-sm text-neutral-700 mt-1",
        labelText: "text-sm text-neutral-700",
        count: "hidden",
        showMore:
          "w-full text-sm text-brand-700 p-1 border border-brand-700 rounded mt-2 bg-orange-100 hover:bg-brand-700 hover:text-white transition",
        disableShowMore: "hidden",
        searchableInput:
          "w-full bg-white text-sm text-brand-700 p-1 border border-neutral-300 rounded",
        searchableSubmit: "bg-white",
      },
    }),
 customHits({
    container: container.querySelector("#hits"),
  })
      
    ]);
search.on("render", async () => {

  if (!enableGraph) return;

  const helper = search.helper;

  const authors = helper.state.disjunctiveFacetsRefinements.author_search || [];
  const works = helper.state.disjunctiveFacetsRefinements["work.title"] || [];

  if (!authors.length && !works.length) {
    selectedJadId.set([]);
    return;
  }

  const filters = [];

  if (authors.length) {
    filters.push(`author_search:=[${authors.join(",")}]`);
  }

  if (works.length) {
    filters.push(`work.title:=[${works.join(",")}]`);
  }

  const filter_by = filters.join(" && ");

  console.log("Typesense filter:", filter_by);

  const ids = await fetchAllFilteredIds(filter_by);

  selectedJadId.set(ids);

  console.log("Graph highlight ids:", ids.length);

});
    search.start();
    //  only active when graph mode is on
    if (enableGraph) {
       container.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn) return;

      selectedJadId.set(btn.dataset.id);
      console.log("Selected Jad ID for graph:", btn.dataset.id);
    });}
  }
  onMount(() => {
    initSearch();
  });

  
</script>

<div id="aside-search-container" bind:this={container} class="w-11/12 mx-auto md:w-64">
    <aside
      class="min-h-full "
      >
      <h2 class="text-xl font-bold text-brand-800 text-center py-2">Select passage</h2>
          <section aria-label="Search in the text of all passages" class="px-3 py-2 border border-neutral-300 rounded m-2 bg-white">
            <h3 class="text-base text-brand-800 px-2 py-1">Search in texts</h3>
            <div bind:this={searchbox} id="searchbox" data-hit-base-path="/text-comparisons" ></div>
        </section>
          <section  id="refinements-section">
            <div class="px-3 py-2 border border-neutral-300 rounded m-2 bg-white">
              <h3 class="text-base text-brand-800 px-2 py-1">Search for authors</h3>
              <div bind:this={refinementsAuthors} id="refinementsAuthors"></div>
            </div>
             
             <div class="px-3 py-2 border border-neutral-300 rounded m-2 bg-white">
              <h3 class="text-base text-brand-800 px-2 py-1">Search for works</h3>
              <div bind:this={refinementsWorks} id="refinementsWorks" class="px-1"></div>
            </div>
          </section>
          <section>
            <div bind:this={hits} id="hits" class="px-4 overflow-y-auto"></div>
          </section>
    </aside>
  </div>