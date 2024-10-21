import instantsearch from "instantsearch.js";
import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
import {
  searchBox,
  hits,
  configure,
  pagination,
  panel,
  refinementList,
  poweredBy,
  clearRefinements,
  currentRefinements,
} from "instantsearch.js/es/widgets";

const typesenseInstantsearchAdapter = new TypesenseInstantsearchAdapter({
  server: {
    apiKey: "nxZkKN7Jphnp1mUFjataIhbKzdxEtd1Y",
    nodes: [
      {
        host: "typesense.acdh-dev.oeaw.ac.at",
        port: "443",
        protocol: "https",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "full_text",
  },
});
// create searchClient
const searchClient = typesenseInstantsearchAdapter.searchClient;
//
const search = instantsearch({
  searchClient,
  indexName: "JAD",
});

// add widgets
search.addWidgets([
  searchBox({
    container: "#searchbox",
    autofocus: true,
    placeholder: "Search",
  }),

  hits({
    container: "#hits",
    templates: {
      empty: "No results for <q>{{ query }}</q>",
      item(hit, { html, components }) {
        return html` <article>
          <a href="/passages/${hit.rec_id}" class="underline text-sm">
            <h3 class="font-semibold text-lg text-brandBrown ">
              ${components.Highlight({
                hit,
                attribute: "title",
              })}
            </h3></a
          >

          <p class="italic">
            ${hit._snippetResult.full_text.matchedWords.length > 0
              ? components.Snippet({ hit, attribute: "full_text" })
              : ""}
          </p>
          <a
            href="/passages/${hit.rec_id}"
            class="underline decoration-dotted text-sm"
            >See passage</a
          >
        </article>`;
      },
    },
  }),

  pagination({
    container: "#pagination",
  }),

  currentRefinements({
    container: "#current-refinements",
  }),
]);

search.start();
