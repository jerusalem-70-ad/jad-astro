import { NoskeSearch } from "acdh-noske-search";

// Debug: Intercept to see what we get
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);

  if (args[0].includes("corpus-search.acdh.oeaw.ac.at")) {
    const clonedResponse = response.clone();
    try {
      const data = await clonedResponse.json();
      console.log("=== API RESPONSE ===", data);
      if (data.Lines?.[0]) {
        console.log("First line:", data.Lines[0]);
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  }

  return response;
};

const search = new NoskeSearch({ container: "noske-search" });

search.search({
  client: {
    base: "https://corpus-search.acdh.oeaw.ac.at/",
    corpname: "jad",
    attrs: "word, id",
    structs: "doc,p",
    refs: "doc.id,doc.corpus,docTitle.id,p.id,head.id,imprimatur.id,list.id",
    viewmode: "kwic",
    pagesize: 20,
  },

  searchInput: {
    id: "noske-search", // Must match div id in HTML
    placeholder: ".*salem",
    css: {
      div: "mb-4",
      input:
        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white",
    },
  },
  // Configure the results display
  hits: {
    id: "hitsbox",
    css: {
      table: "table-auto w-full",
      thead: "bg-brand-100",
      th: "px-4 py-2 text-left",
      tbody: "divide-y",
      td: "px-4 py-2",
      kwic: "font-bold text-brand-600", // The matched keyword
      left: "text-right text-gray-600 pr-2", // Context before match
      right: "text-gray-600", // Context after match
    },
  },

  // Configure pagination
  pagination: {
    id: "noske-pagination",
    css: {
      div: "flex gap-2",
      select: "border rounded px-2 py-1",
    },
  },

  // Configure stats display
  stats: {
    id: "noske-stats",
    label: "Results found:",
    css: {
      div: "mb-4",
      label: "font-medium",
    },
  },
  // Additional config
  config: {
    results: "kwic", // or "sen" for sentence view
    urlparam: true, // Enable URL parameters for sharing searches
  },
});
