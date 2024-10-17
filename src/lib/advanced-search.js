import { createTypesenseClient } from "../lib/create-typesense-client"; // import the function that creates a client with the proper User API

const client = createTypesenseClient();

// set search parameters either separate in a variable or directly in the result function

let searchParameters = {
  q: "", // q stands for query, in this case empty - it should take the user's input
  query_by: "title", // we set the index field where the query should be found
  sort_by: "ratings_count:desc", // optional
};

const result = await client
  .collections("JAD-temp")
  .documents()
  .search({ q: "", query_by: "title" });

const searchForm = document.querySelector("form[data-search-form]");

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const q = formData.get("query");

  /* //Ask Stefan WHY NOT USE THIS?
    const w = document.querySelector("input[data-search-input]").value
    
    */

  // TODO:
  // read the users' input
  console.log(q);
  // pass this to typesense using the client
  result(q).map((item) => {
    // get back the info - passages in the section ul
    const results = document.querySelector("ul[data-search-result]"); // <ul>
    return results.insertAdjacentElement("beforeend", li);
  });
});
