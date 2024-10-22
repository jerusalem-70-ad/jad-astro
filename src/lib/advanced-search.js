import instantsearch from "instantsearch.js";
import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";
import {
  searchBox,
  hits,
  stats,
  pagination,
  panel,
  refinementList,
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

const refinementListAuthor = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Authors",
  },
})(refinementList);

const refinementListWork = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Works",
  },
})(refinementList);

const refinementListManuscript = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Manuscripts",
  },
})(refinementList);

const refinementListWorkDate = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Date of work",
  },
})(refinementList);

const refinementListLanguage = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Language",
  },
})(refinementList);

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

  stats({
    container: "#stats-container",
  }),

  refinementListAuthor({
    container: "#refinement-list-author",
    attribute: "work.author.name",
    searchable: true,
    searchablePlaceholder: "Search for authors",
  }),

  refinementListWork({
    container: "#refinement-list-work",
    attribute: "work.title",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for works",
  }),

  refinementListWorkDate({
    container: "#refinement-list-workdate",
    attribute: "work.written_date",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for dates",
  }),

  refinementListManuscript({
    container: "#refinement-list-manuscript",
    attribute: "manuscript.name.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for manuscript",
  }),

  refinementListLanguage({
    container: "#refinement-list-language",
    attribute: "language.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for language",
  }),

  currentRefinements({
    container: "#current-refinements",
  }),

  clearRefinements({
    container: "#clear-refinements",
  }),
]);

search.start();
