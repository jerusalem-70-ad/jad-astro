import { NoskeSearch } from "acdh-noske-search";

const search = new NoskeSearch({ container: "noske-search" });

search.search({
  client: {
    base: "https://corpus-search.acdh.oeaw.ac.at/",
    corpname: "jad",
    attrs: "word,id,chapter.id,chapter.landingpageuri",
    structs: "doc,p,head,list,docTitle,imprimatur,g",
    refs: "doc.id,doc.corpus,p.id,head.id,list.id,docTitle.id,imprimatur.id",
    viewmode: "sen",
    pagesize: 20,
  },

  searchInput: {
    id: "noske-search",
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
      table: "w-full block",
      trBody: "border rounded-sm mb-2 px-4 py-2",
      th: "hidden",
      kwic: "font-bold text-brand-600",
      left: "text-gray-600",
      right: "text-gray-600",
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
  config: {},
});

const searchButton = document.getElementById("noske-search-button");
if (searchButton) {
  searchButton.addEventListener("click", () => {
    search.search();
  });
}
