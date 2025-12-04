import Typesense from "typesense";
import { withBasePath } from "./withBasePath";

export default async function tsNoskeSearch(query, container) {
  if (!container) container = document.querySelector(".ts-details");
  const client = new Typesense.Client({
    nodes: [
      {
        host: "typesense.acdh-dev.oeaw.ac.at",
        port: 443,
        protocol: "https",
      },
    ],
    apiKey: "IA6BWzRrMo7yX3eFqgcFelJzhWkIl64W",
    connectionTimeoutSeconds: 5,
  });

  const collectionName = "JAD-temp";

  try {
    const searchResults = await client
      .collections(collectionName)
      .documents()
      .search({
        q: query,
        query_by: "rec_id", // field(s) to search in
        sort_by: "sort_id:asc",
        per_page: 1, // number of results
      });

    // Extract title, author, jad_id
    const hits = searchResults.hits.map((hit) => {
      const doc = hit.document;
      return {
        work: doc.work[0].title,
        author: doc.work[0].author[0].name,
        jad_id: doc.rec_id.split("__")[1],
        url: withBasePath(`/passages/${doc.id}`),
      };
    });

    if (hits.length === 0) {
      container.innerHTML = `<p>No results for <q>${query}</q></p>`;
      return;
    }
    console.log("Typesense hits:", hits);
    container.innerHTML = hits
      .map(
        (h) => `
        <ul>
            <li><strong>Author:</strong> ${h.author}</li>
            <li><strong>Title:</strong> ${h.work}</li>
            <li><strong>Passage ID:</strong> ${h.jad_id}</li>
        </ul>
         <div class="flex items-end">
            <a class="button-custom" href="${h.url}">View Passage</a>
        </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Typesense search error:", error);
    const container = document.querySelector(".ts-details");
    if (container)
      container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}
