import CustomNoskeSearch from "@/lib/noske/noske-custom-search.js";

const search = new CustomNoskeSearch({
  baseUrl: "https://corpus-search.acdh.oeaw.ac.at",
  corpname: "jad",
  attrs: "word,lemma,pos,landingPageURI,orth,norm",
  refs: "chapter.lang,chapter.title,chapter.uri",
  structs: "s,chapter",
  viewmode: "sen",
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
