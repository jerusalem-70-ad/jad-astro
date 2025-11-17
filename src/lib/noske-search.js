import CustomNoskeSearch from "@/lib/noske-custom-search.js";

const search = new CustomNoskeSearch({
  baseUrl: "https://corpus-search.acdh.oeaw.ac.at",
  corpname: "jad",
  attrs: "word,lemma,pos",
  refs: "doc#, chapter#, p#, s#",
  structs: "doc,p", // Structures to include
  viewmode: "sen", // Sentence view or 'kwic'
  pagesize: 20,
  searchTypeSelectId: "search-type-select",

  // HTML element IDs
  searchInputId: "search-input",
  searchButtonId: "search-button",
  resultsId: "results",
  statsId: "stats",
  paginationId: "pagination",
});

console.log("Custom NoSketch search initialized!");
