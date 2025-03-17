import { withBasePath } from "./withBasePath";
export function setupTableActions(table, title) {
  const tableTitle = title.toLowerCase();
  const projectAbbr = "jad";

  // Entry detail view navigation
  table.on("rowClick", (e, row) => {
    const data = row.getData();
    const url = withBasePath(`/${title}/${data["jad_id"]}`);
    window.open(url, "_self");
  });

  // Counter updates
  table.on("dataLoaded", (data) => updateCounters(data.length));
  table.on("dataFiltered", (_, data) => updateCounters(data.length));

  function updateCounters(count) {
    const counter1 = document.querySelector("#counter1");
    const counter2 = document.querySelector("#counter2");
    if (counter1) counter1.innerHTML = `${count}`;
    if (counter2) counter2.innerHTML = `${count}`;
  }

  // Download CSV
  document.querySelector("#download-csv")?.addEventListener("click", () => {
    table.download("csv", `${projectAbbr}-${tableTitle}-data.csv`);
  });

  // Download JSON
  document.querySelector("#download-json")?.addEventListener("click", () => {
    table.download("json", `${projectAbbr}-${tableTitle}-data.json`);
  });

  // Download HTML
  document.querySelector("#download-html")?.addEventListener("click", () => {
    table.download("html", `${projectAbbr}-${tableTitle}-data.html`, {
      style: true,
    });
  });
}
