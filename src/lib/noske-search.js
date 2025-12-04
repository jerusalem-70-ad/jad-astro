import CustomNoskeSearch from "@/lib/noske-custom-search.js";
import tsNoskeSearch from "@/lib/ts-search-noske.js";

const search = new CustomNoskeSearch({
  baseUrl: "https://corpus-search.acdh.oeaw.ac.at",
  corpname: "jad",
  attrs: "word,lemma,pos,chapter,chapter.ID, chapter.id",
  refs: "ID, landingPageURI",
  structures: "doc,p, chapter",
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
