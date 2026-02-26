import instantsearch from "instantsearch.js";
import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
import {
  searchBox,
  infiniteHits,
  refinementList,
} from "instantsearch.js/es/widgets";
import { withBasePath } from "./withBasePath";
import authorLookupMap from "@/content/data/authors_map.json";

export function initSearch() {
  const project_collection_name = "JAD-temp";
  const search_api_key = "IA6BWzRrMo7yX3eFqgcFelJzhWkIl64W";
  const root = document.querySelector("#searchbox");
  const hitBasePath = root?.dataset.hitBasePath || "/passages";

  const main_search_field = "full_text";
  const secondary_field = "search_text";

  const typesenseInstantsearchAdapter = new TypesenseInstantsearchAdapter({
    server: {
      apiKey: search_api_key,
      nodes: [
        {
          host: "typesense.acdh-dev.oeaw.ac.at",
          port: "443",
          protocol: "https",
        },
      ],
    },
    additionalSearchParameters: {
      query_by: `${main_search_field}, ${secondary_field}`,
      query_by_weights: "2,1",
      sort_by: "sort_id:asc",
      per_page: 10,
    },
  });

  const searchClient = typesenseInstantsearchAdapter.searchClient;

  const search = instantsearch({
    searchClient,
    indexName: project_collection_name,
  });

  search.addWidgets([
    searchBox({
      container: "#searchbox",
      autofocus: true,
      placeholder: "Search in text of passages",
      cssClasses: {
        root: "w-full  px-2 bg-white",
        form: "w-full",
        input: "border-3 border-red-800 rounded-sm",
      },
    }),
    refinementList({
      container: "#refinement-list-author",
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
      container: "#refinement-list-work",
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
      container: "#hits",

      templates: {
        empty({ query }, { html }) {
          return html`No results for <q>${query}</q>`;
        },

        item(hit, { html }) {
          const title = hit.position_in_work
            ? `${hit.work[0].title} (${hit.position_in_work})`
            : hit.work?.[0]?.title || "N/A";

          const passageTitle =
            hit.work?.[0]?.author?.length > 0
              ? `${hit.work[0].author[0].name}: ${title}`
              : title || "N/A";
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
}

document.addEventListener("DOMContentLoaded", () => {
  initSearch();
});
