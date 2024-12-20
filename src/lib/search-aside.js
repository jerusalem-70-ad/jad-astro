import passages from "../content/data/passages.json";

const searchForm = document.querySelector("form[data-search-form]");
const results = document.querySelector("ul[data-results-list]");
const inputSearch = document.querySelector("input[data-input]");
console.log(passages);

const doSearch = (query = "") => {
  const cleanQuery = query.trim().toLowerCase();
  const filtered = Object.values(passages).filter((passage) =>
    passage.passage.toLowerCase().includes(cleanQuery)
  );

  results.innerHTML = "";

  filtered.forEach((passage) => {
    const listItem = document.createElement("li");
    listItem.classList.add(
      "list-disc",
      "overflow-hidden",
      "whitespace-nowrap",
      "text-ellipsis",
      "max-w-md",
      "hover:text-wrap"
    );
    listItem.id = `passage-${passage.id}`;
    const link = document.createElement("a");
    link.href = `/passages/${passage.jad_id}`;
    link.classList.add("hover:text-brandRed");
    link.innerHTML = `(${passage.jad_id.substring(15)}) <span class="italic">${
      passage.passage
    }</span>`;

    listItem.appendChild(link);
    results.appendChild(listItem);
  });
};

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  doSearch(inputSearch.value);
});
