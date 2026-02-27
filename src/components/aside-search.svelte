<script>
  import { onMount } from "svelte";
  import instantsearch from "instantsearch.js";
  import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
  import {
    searchBox,
    infiniteHits,
    refinementList,
  } from "instantsearch.js/es/widgets";

  import authorLookupMap from "@/content/data/authors_map.json";
  import { withBasePath } from "@/lib/withBasePath";
// svelte store to write the selected Jad id for the graph db to read and trigger the similarity search
  import { selectedJadId } from '@/lib/stores/jad_store';

  export let enableGraph = false; 

  // set elements for the search,bind them later for reactivity
  let container;
  let searchbox;
let refinementsAuthors;
let refinementsWorks;
let hits;

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


  const root = document.querySelector("#searchbox");
  const hitBasePath = root?.dataset.hitBasePath || "/passages";

    search.addWidgets([
      searchBox({
        container: searchbox,
        placeholder: "Search in texts",
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

      infiniteHits({
        container: container.querySelector("#hits"),
        templates: {
          item(hit, { html }) {
             const title = hit.position_in_work
            ? `${hit.work[0].title} (${hit.position_in_work})`
            : hit.work?.[0]?.title || "N/A";

          const passageTitle =
            hit.work?.[0]?.author?.length > 0
              ? `${hit.work[0].author[0].name}: ${title}`
              : title || "N/A";

            if (enableGraph) {
              return html`
                <li class="py-1 ">
                  <button
                    class="text-start underline text-sm text-brand-700 hover:text-brand-500"
                    data-id="${hit.id}"
                  >
                    (#${hit.id.substr(16)}) ${passageTitle}
                  </button>
                </li>
              `;
            }

            return html`
              <li class="list-none py-2 ml-1.5">
              <a
                href="${withBasePath(`${hitBasePath}/${hit.id}`)}"
                class="underline text-sm font-medium text-brand-700 hover:text-brand-500 transition"
              >
                (#${hit.id.substr(16)}) ${passageTitle}
              </a>
            </li>
            `;
          },
        },
      }),
    ]);

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

<div bind:this={container} >     
    <aside
      class="min-h-full "
      >
      <h2 class="text-xl font-bold text-brand-800 text-center py-2">Select passage</h2>
          <div bind:this={searchbox} id="searchbox" data-hit-base-path="/text-comparisons" aria-label="Search in the text of all passages" class="py-3 px-2"></div>
          <section  id="refinements-section">
            <section class="px-3 py-2 border border-neutral-300 rounded m-2 bg-white">
              <h3 class="text-base text-brand-800 px-2 py-1">Search for authors</h3>
              <div bind:this={refinementsAuthors} id="refinementsAuthors"></div>
            </section>
             
             <section class="px-3 py-2 border border-neutral-300 rounded m-2 bg-white">
              <h3 class="text-base text-brand-800 px-2 py-1">Search for works</h3>
              <div bind:this={refinementsWorks} id="refinementsWorks" class="px-1"></div>
            </section>
          </section>
          <section>
            <div bind:this={hits} id="hits" class="px-4 overflow-y-auto"></div>
          </section>
    </aside>
  </div>