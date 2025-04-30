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
  hierarchicalMenu,
} from "instantsearch.js/es/widgets";
import { simple } from "instantsearch.js/es/lib/stateMappings";

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
    typo_tokens_threshold: 50,
  },
});

// Create the searchClient
const searchClient = typesenseInstantsearchAdapter.searchClient;

// Initialize InstantSearch
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
  routing: {
    stateMapping: simple(),
    createURL: (state) => {
      const { query, refinementList, page } = state;
      // Modify the structure here to avoid square brackets
      const queryParam = query ? `JAD-query=${query}` : "";
      const filters = refinementList
        ? `filters=${JSON.stringify(refinementList)}`
        : "";
      const pageParam = page ? `page=${page}` : "";
      return `/?${[queryParam, filters, pageParam].filter(Boolean).join("&")}`;
    },
    parseURL: (url) => {
      const urlParams = new URLSearchParams(url);
      return {
        query: urlParams.get("JAD-query") || "",
        refinementList: JSON.parse(urlParams.get("filters") || "{}"),
        page: parseInt(urlParams.get("page") || "1", 10),
      };
    },
  },
});

// Custom comparator function to sort century arrays for the refinement list 'Century of work'
const centuryComparator = (a, b) => {
  const extractCentury = (str) => {
    const value = str?.name || str; // Handle both direct strings and refinement objects
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return extractCentury(a) - extractCentury(b);
};

// refinements list in panel function
const refinementListAuthor = wrapInPanel("Autor");
const refinementListWork = wrapInPanel("Work");
const refinementListManuscript = wrapInPanel("Manuscripts");
const refinementListWorkDate = wrapInPanel("Date of work");
const refinementListWorkCentury = wrapInPanel("Century of work");
const refinementListContext = wrapInPanel("Institutional context");
const refinementListliturgical = wrapInPanel("Liturgical references");
const refinementListClusters = wrapInPanel("Clusters");
const refinementListKeywords = wrapInPanel("Keywords");
const hierarchicalMenuBibl = wrapHierarcicalMenuInPanel("Biblical references");
const refinementListSources = wrapInPanel("Sources");

// Initialize a custom Algolia widget to allow users to filter results by a range of years
// filter input from and to to two different attributes in the schema (not possible with the default range input widget)
// init() required function when building a custom widget
// inside it 1. create the HTML structure
// 2. add event listeners to the form
// 3. use the helper to add the filter to the search, clear the old refinements
// 4. add real-time validation to the inputs
// 5. add getWidgetRenderState() to allow the currentRefinements widget to "see" this refinement
const customDateRangeWidget = (containerId) => {
  return {
    init({ helper, state, createURL }) {
      // Create the HTML structure for the date range widget with two inputs and apply button
      const container = document.querySelector(containerId);
      container.innerHTML = `
        <details class="ais-Panel border-b group">
          <summary class="ais-Panel-header cursor-pointer relative z-10 flex items-center justify-between">
            <span class="normal-case text-base font-normal">Year Range</span>
            <span class="ais-Panel-collapseIcon transition-transform duration-300 group-open:rotate-[-90deg]">
              <svg style="width: 1em; height: 1em;" viewBox="0 0 500 500">
                <path d="M100 250l300-150v300z" fill="currentColor"></path>
              </svg>
            </span>
          </summary>
          <div class="ais-Panel-body">
            <div class="ais-RangeInput">
              <form class="ais-RangeInput-form">
                <input class="ais-RangeInput-input" type="number" id="date-from-year" min="70" max="1600" placeholder="From year">
                <input class="ais-RangeInput-input" type="number" id="date-to-year" min="70" max="1600" placeholder="To year">
                <button type="submit" class="ais-RangeInput-submit">Apply</button>
              </form>
            </div>
          </div>
        </details>
      `;

      const form = container.querySelector("form");
      const fromInput = container.querySelector("#date-from-year");
      const toInput = container.querySelector("#date-to-year");

      // add event listeners to the inputs
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Clear old refinements
        helper.clearRefinements("work_date_not_before");
        helper.clearRefinements("work_date_not_after");

        const from = parseInt(fromInput.value, 10);
        const to = parseInt(toInput.value, 10);
        // Validate: Ensure 'From year' < 'To year'
        if (from >= to) {
          toInput.setCustomValidity(
            "The 'To year' must be greater than the 'From year'."
          );
          // Don't submit if validation fails
          return;
        } else {
          toInput.setCustomValidity(""); // Reset the error message if valid
        }

        // Proceed if both values are valid numbers;
        // helper.addNummericRefinemnt - standard Algolia method to add a numeric filter
        if (!isNaN(from)) {
          helper.addNumericRefinement("work_date_not_before", ">=", from);
        }
        if (!isNaN(to)) {
          helper.addNumericRefinement("work_date_not_after", "<=", to);
        }

        // Perform the search after validation
        helper.search();
      });
      // Add real-time validation reset to allow resubmission after correcting the input
      fromInput.addEventListener("input", () => {
        toInput.setCustomValidity(""); // Reset error if the user changes 'From year'
        toInput.reportValidity(); // Show the validity message (if any)
      });

      toInput.addEventListener("input", () => {
        const from = parseInt(fromInput.value, 10);
        const to = parseInt(toInput.value, 10);

        // Re-check the condition if the 'To year' is still valid after the change
        if (from >= to) {
          toInput.setCustomValidity(
            "The 'To year' must be greater than the 'From year'."
          );
        } else {
          toInput.setCustomValidity(""); // Reset the error if condition is met
        }

        toInput.reportValidity(); // Show the validity message (if any)
      });
    },

    getWidgetRenderState({ helper }) {
      // Required so currentRefinements widget can "see" this refinement
      const refinements = [];

      const from = helper.getNumericRefinements("work_date_not_before");
      if (from["≥"]) {
        refinements.push({
          attribute: "work_date_not_before",
          type: "numeric",
          value: () => {
            helper.removeNumericRefinement("work_date_not_before", ">=");
            helper.search();
          },
          label: `From ${from["≥"][0]}`,
        });
      }

      const to = helper.getNumericRefinements("work_date_not_after");
      if (to["≤"]) {
        refinements.push({
          attribute: "work_date_not_after",
          type: "numeric",
          value: () => {
            helper.removeNumericRefinement("work_date_not_after", "<=");
            helper.search();
          },
          label: `To ${to["≤"][0]}`,
        });
      }

      return {
        refinements,
      };
    },
  };
};

// add widgets
search.addWidgets([
  searchBox({
    container: "#searchbox",
    autofocus: true,
    placeholder: "Text search",
  }),
  customDateRangeWidget("#date-range-widget"),
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
            <h3 class="font-semibold text-base md:text-lg text-brand-800">
              <a href="${withBasePath(
                `/passages/${hit.id}`
              )}" class="underline">
                (#${hit.id.substr(16)}) ${hit.title}
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
    searchablePlaceholder: "e.g. Hieronymus",
  }),

  refinementListWork({
    container: "#refinement-list-work",
    attribute: "work.title",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. Epistolae",
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

  refinementListWorkCentury({
    container: "#refinement-list-workcentury",
    attribute: "work.date.century",
    searchable: true,
    sortBy: centuryComparator,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. 9th c.",
  }),

  refinementListManuscript({
    container: "#refinement-list-manuscript",
    attribute: "manuscripts.manuscript",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. MS 999",
  }),

  refinementListClusters({
    container: "#refinement-list-clusters",
    attribute: "cluster.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. Crusade",
  }),

  refinementListContext({
    container: "#refinement-list-context",
    attribute: "work.institutional_context.name",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. Benedictines",
  }),

  refinementListKeywords({
    container: "#refinement-list-keywords",
    attribute: "keywords.name",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. Heresy",
  }),
  refinementListliturgical({
    container: "#refinement-list-liturgical",
    attribute: "liturgical_references.value",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. Pentecost",
  }),
  refinementListSources({
    container: "#refinement-list-sources",
    attribute: "sources.author",
    searchable: true,
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. Beda",
  }),

  hierarchicalMenuBibl({
    container: "#refinement-list-biblical",
    attributes: ["biblical_ref_lvl0", "biblical_ref_lvl1", "biblical_ref_lvl2"],
    separator: " > ",
    showMore: true,
    showMoreLimit: 50,
    limit: 10,
    searchablePlaceholder: "e.g. Luke",
  }),

  currentRefinements({
    container: "#current-refinements",
    transformItems(items) {
      return items.map((item) => ({
        ...item,
        label:
          item.attribute === "biblical_ref_lvl0"
            ? "Bible book"
            : item.attribute === "work.author.name"
            ? "Author"
            : item.attribute === "work.title"
            ? "Work"
            : item.attribute === "manuscripts.value"
            ? "Manuscript"
            : item.attribute === "work.date.value"
            ? "Date"
            : item.attribute === "work.date.century"
            ? "Century"
            : item.attribute === "work.institutional_context.name"
            ? "Institution"
            : item.attribute === "cluster.value"
            ? "Cluster"
            : item.attribute === "keywords.name"
            ? "Keyword"
            : item.attribute === "Liturgical_references.value"
            ? "Liturgy"
            : item.attribute === "sources.author"
            ? "Source"
            : item.attribute === "work_date_not_before"
            ? "Date"
            : item.attribute === "work_date_not_after"
            ? "Date"
            : item.attribute,
      }));
    },
  }),

  clearRefinements({
    container: "#clear-refinements",
  }),
]);

search.start();

// function to wrap refinements filter in a panel
function wrapInPanel(title) {
  return panel({
    collapsed: ({ state }) => {
      return state.query.length === 0;
    },
    templates: {
      header: () =>
        `<span class="normal-case text-base font-normal">${title}</span>`,
    },
    cssClasses: {
      header: "cursor-pointer relative z-10",
      collapseButton: "absolute inset-0 z-20 flex flex-row-reverse",
      collapseIcon: "",
      root: "border-b",
    },
  })(refinementList);
}

function wrapHierarcicalMenuInPanel(title) {
  return panel({
    collapsed: ({ state }) => {
      return state.query.length === 0;
    },
    templates: {
      header: () =>
        `<span class="normal-case text-base font-normal">${title}</span>`,
    },
    cssClasses: {
      header: "cursor-pointer relative z-10",
      collapseButton: "absolute inset-0 z-20 flex flex-row-reverse",
      collapseIcon: "",
      root: "border-b",
    },
  })(hierarchicalMenu);
}

// Filter show/hide functionality for mobile
// This code will show/hide the filter section when the button is clicked
const showFilter = document.querySelector("#filter-button");
const filters = document.querySelector("#refinements-section");
if (showFilter) {
  showFilter.addEventListener("click", function () {
    filters?.classList.toggle("hidden");
  });
}
