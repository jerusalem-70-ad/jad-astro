import instantsearch from "instantsearch.js";
import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
import { searchBox, infiniteHits } from "instantsearch.js/es/widgets";
import { withBasePath } from "./withBasePath";

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
      per_page: 20,
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
      placeholder: "Search in all passages ...",
    }),
    infiniteHits({
      container: "#hits",

      templates: {
        empty({ query }, { html }) {
          return html`No results for <q>${query}</q>`;
        },

        item(hit, { html }) {
          return html`
            <li class="list-none px-0 py-2">
              <a
                href="${withBasePath(`${hitBasePath}/${hit.id}`)}"
                class="underline text-sm font-medium text-brand-700 hover:text-brand-500 transition"
              >
                (#${hit.id.substr(16)})
                ${hit.work?.[0]?.author?.length > 0
                  ? ` ${hit.work?.[0]?.author[0].name}: ${hit.work?.[0]?.title}`
                  : hit.work?.[0]?.title || "N/A"}
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
