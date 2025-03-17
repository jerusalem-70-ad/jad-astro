import instantsearch from "instantsearch.js";
import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
import { searchBox, infiniteHits } from "instantsearch.js/es/widgets";
import { withBasePath } from "./withBasePath";

const project_collection_name = "JAD-temp";
const main_search_field = "full_text";
const search_api_key = "IA6BWzRrMo7yX3eFqgcFelJzhWkIl64W";

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
    query_by: main_search_field,
    sort_by: "sort_id:asc",
  },
});
// create searchClient
const searchClient = typesenseInstantsearchAdapter.searchClient;
//
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
});

// add widgets
search.addWidgets([
  searchBox({
    container: "#searchbox",
    autofocus: true,
    placeholder: "Search pasage text",
  }),
  infiniteHits({
    container: "#hits",
    sortBy: ["id:asc"],
    templates: {
      empty: "No results for <q>{{ query }}</q>",
      item(hit, { html, components }) {
        // Generate the main HTML for the hit
        return html`
          <article>
            <h3 class="font-semibold text-brand-800">
              <a
                href="${withBasePath(`/passages/${hit.id}`)}"
                class="underline"
              >
                (#${hit.id.substr(15)}) ${hit.title}
              </a>
            </h3>

            <p>
              ${hit._snippetResult.full_text.matchedWords.length > 0
                ? components.Snippet({ hit, attribute: "full_text" })
                : ""}
            </p>
          </article>
        `;
      },
    },
  }),
]);

search.start();
