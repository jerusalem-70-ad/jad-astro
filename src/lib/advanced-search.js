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
import { withBasePath } from "./withBasePath";

const project_collection_name = "JAD-temp";
const main_search_field = "search_text";
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
    typo_tokens_threshold: 50,
  },
});
// create searchClient
const searchClient = typesenseInstantsearchAdapter.searchClient;
//
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
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

const refinementListKeywords = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Keywords",
  },
})(refinementList);

const refinementListClusters = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Clusters",
  },
})(refinementList);

const refinementListliturgical = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Liturgical references",
  },
})(refinementList);

const refinementListContext = panel({
  collapsed: ({ state }) => {
    return state.query.length === 0;
  },
  templates: {
    header: "Institutional context",
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
    transformItems(items) {
      return items.map((item) => {
        // Transform `work` array for easier rendering
        const transformedWorks = (item.work || []).map((work) => ({
          title: work.name || "Unknown Title",
          authors: (work.author || []).map(
            (author) => author.name || "Unknown Author"
          ),
          date: (work.date.map((date) => date.value) || []).join(", "),
        }));

        return {
          ...item,
          transformedWorks,
        };
      });
    },
    templates: {
      empty: "No results for <q>{{ query }}</q>",
      item(hit) {
        // Generate HTML for each transformed work
        const renderWorks = (works) => {
          if (!works || works.length === 0) return "<p>No works available</p>";

          return works
            .map(
              (work) => `
                <div class="work-item">
                  <p><strong>Title:</strong> ${work.title}</p>
                  <p><strong>Authors:</strong> ${work.authors.join(", ")}</p>
                  <p><strong>Date:</strong> ${work.date}</p>
                </div>
              `
            )
            .join("");
        };

        // Generate the main HTML for the hit
        return `
          <article>
            <h3 class="font-semibold text-lg text-brandBrown">
              <a href="${withBasePath(
                `/passages/${hit.id}`
              )}" class="underline">
                (#${hit.id.substr(15)}) ${hit.title}
              </a>
            </h3>            
          
            <p class="italic line-clamp-2">
              ${hit._snippetResult?.full_text?.value || ""}
            </p>
            <div class="work-details">
              ${renderWorks(hit.transformedWorks)}
            </div>            
          </article>
        `;
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
    attribute: "work.date.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for dates",
  }),

  refinementListManuscript({
    container: "#refinement-list-manuscript",
    attribute: "manuscripts.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for manuscript",
  }),

  refinementListClusters({
    container: "#refinement-list-clusters",
    attribute: "cluster.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for clusters",
  }),

  refinementListContext({
    container: "#refinement-list-context",
    attribute: "work.institutional_context.name",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for context",
  }),

  refinementListKeywords({
    container: "#refinement-list-keywords",
    attribute: "keywords.name",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for keywords",
  }),
  refinementListliturgical({
    container: "#refinement-list-liturgical",
    attribute: "liturgical_references.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "Search for liturgical references",
  }),

  currentRefinements({
    container: "#current-refinements",
  }),

  clearRefinements({
    container: "#clear-refinements",
  }),
]);

search.start();
