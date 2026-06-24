// Custom NoSketch Engine Search Implementation
// Based on: https://raw.githubusercontent.com/acdh-oeaw/noske-ubi9/main/openapi/openapi.yaml
import { downloadCsv, downloadHtml } from "@/lib/noske/download-results";
import { withBasePath } from "@/lib/withBasePath";
import { fetchPassages } from "@/lib/noske/download-results";
const uniqueJadIds = new Set();
let currentQuery = "";

class CustomNoskeSearch {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.corpname = config.corpname;
    this.attrs = "word,lemma,pos,landingPageURI,orth,norm";
    this.refs = config.refs || "doc#";
    this.structs = config.structs || "doc,p";
    this.viewmode = config.viewmode || "sen";
    this.pagesize = config.pagesize || 20;
    this.searchType = config.searchType || "simple";
    this.searchInputId = config.searchInputId;
    this.searchButtonId = config.searchButtonId;
    this.searchTypeSelectId = config.searchTypeSelectId;
    this.resultsId = config.resultsId;
    this.statsId = config.statsId;
    this.paginationId = config.paginationId;
    this.currentPage = 1;
    this.currentResults = null;
    this.init();
  }

  init() {
    const searchButton = document.getElementById(this.searchButtonId);
    const searchInput = document.getElementById(this.searchInputId);
    const searchTypeSelect = document.getElementById(this.searchTypeSelectId);
    if (searchButton) {
      searchButton.addEventListener("click", () => this.executeSearch());
    }
    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.executeSearch();
      });
    }
    if (searchTypeSelect) {
      searchTypeSelect.addEventListener("change", (e) => {
        this.searchType = e.target.value;
        console.log(`Search type changed to: ${this.searchType}`);
      });
    }
  }

  async executeSearch(page = 1) {
    const searchInput = document.getElementById(this.searchInputId);
    const query = searchInput ? searchInput.value : "";
    if (!query) {
      console.warn("No search query provided");
      return;
    }
    this.currentPage = page;
    this.showLoading();
    try {
      const results = await this.search(query, page);
      this.currentResults = results;
      await this.displayResults(results);
      this.displayStats(results);
      this.displayPagination(results);
    } catch (error) {
      console.error("Search error:", error);
      this.showError(error.message);
    }
  }

  async search(query, page = 1) {
    let queryParam;
    switch (this.searchType) {
      case "cql":
        queryParam = query.startsWith("q") ? query : `q${query}`;
        break;
      case "lemma":
        queryParam = `q[lemma="${query}"]`;
        break;
      case "phrase":
        const words = query.trim().split(/\s+/);
        const phraseQuery = words.map((word) => `[word="${word}"]`).join("");
        queryParam = `q${phraseQuery}`;
        break;
      case "word":
        queryParam = `q[word="${query}"]`;
        break;
      case "simple":
      default:
        queryParam = `q[word="${query}"]`;
        break;
    }

    const params = new URLSearchParams({
      corpname: this.corpname,
      q: queryParam,
      attrs: this.attrs,
      refs: this.refs,
      structs: this.structs,
      viewmode: this.viewmode,
      pagesize: this.pagesize,
      fromp: page,
      format: "json",
      asyn: 0,
    });

    const url = `${
      this.baseUrl
    }/bonito/run.cgi/concordance?${params.toString()}`;
    console.log("=== SEARCH REQUEST ===");
    console.log("URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error("Invalid JSON received from NoSketch Engine");
    }

    console.log("=== SEARCH RESPONSE ===");
    console.log("Full response:", data);

    if (data.Lines && data.Lines.length > 0) {
      console.log("=== FIRST HIT ===");
      console.log("Landing Page URI:", data.Lines[0].Kwic[0].attr);
    }

    return data;
  }

  async displayResults(data) {
    const resultsContainer = document.getElementById(this.resultsId);
    if (!resultsContainer) return;

    if (!data.Lines || data.Lines.length === 0) {
      resultsContainer.innerHTML = "<p>No results found.</p>";
      return;
    }

    let html = '<div class="search-results">';
    html += `
<div class="flex justify-end gap-3 py-3">
  <button class="py-2 px-4 font-semibold bg-brand-600 hover:bg-brand-500 text-brand-50 rounded-md" 
    id="download-csv">
    Download results as CSV
  </button>
  <button class="py-2 px-4 font-semibold bg-brand-600 hover:bg-brand-500 text-brand-50 rounded-md" 
    id="download-html">
    Download results as HTML
  </button>
</div>
`;

    const results = [];
    currentQuery = data.q || "";
    data.Lines.forEach((line, index) => {
      const leftText = this.buildText(line.Left);
      const kwicText = this.buildText(line.Kwic);
      const rightText = this.buildText(line.Right);

      // Extract jad_id from landingPageURI
      const jad_id =
        line.Kwic[0].attr.split("passages/")[1].split(".html")[0] || "#";
      results.push({ jad_id, leftText, kwicText, rightText });
      uniqueJadIds.add(jad_id);
      html += `
        <div class="result-item">
          <div class="result-text">
            ${leftText ? `<span class="left-context">${leftText}</span>` : ""}
            <span class="kwic">${kwicText}</span>
            ${rightText ? `<span class="right-context">${rightText}</span>` : ""}
          </div> 
          <div class="ts-details mt-4" data-id="${jad_id}"></div>       
        </div>
      `;
    });
    //noske brings only the text; the metadata we fetch from public matching the jad_id
    const passages = await fetchPassages(results);
    const passageMap = new Map(passages.map((p) => [p.jad_id, p]));

    html += "</div>";
    resultsContainer.innerHTML = html;

    resultsContainer.querySelectorAll(".ts-details").forEach((div) => {
      const jad_id = div.getAttribute("data-id");

      const passage = passageMap.get(jad_id);

      if (!passage) return;

      const url = withBasePath(`/data/passages/${passage.jad_id}`);

      div.innerHTML = `
      <div class="flex justify-between">
        <dl class="grid grid-cols-2 gap-x-4">
          <dt class="font-semibold">Author:</dt>
          <dd>${passage.work?.[0]?.author ?? ""}</dd>

          <dt class="font-semibold">Title:</dt>
          <dd>${passage.work?.[0]?.title ?? ""}</dd>

          <dt class="font-semibold">Position in Work:</dt>
          <dd>${passage.position_in_work ?? ""}</dd>

          <dt class="font-semibold">Passage ID:</dt>
          <dd>${passage.id}</dd>
        </dl>
        
        <div class="flex items-end">
        <a
        class="button-custom"
        href="${url}"
        >
        View Passage
        </a>
        </div>
      </div>
      <details>
      <summary class="cursor-pointer">See original spelling (text might be normalized to facilitate lemmatizing).</summary>
      <div>${passage.text_paragraph}</div>
      </details>
    `;
    });
    resultsContainer
      .querySelector("#download-csv")
      ?.addEventListener("click", () => {
        downloadCsv(results).catch(console.error);
      });
    resultsContainer
      .querySelector("#download-html")
      ?.addEventListener("click", () => {
        downloadHtml(results, currentQuery).catch(console.error);
      });
  }

  buildText(tokenArray) {
    if (!Array.isArray(tokenArray)) return "";

    return tokenArray
      .map((token) => token?.str)
      .filter(
        (str) => typeof str === "string" && str.trim() !== "" && str !== "null",
      )
      .join(" ");
  }

  displayStats(data) {
    const statsContainer = document.getElementById(this.statsId);
    if (!statsContainer) return;
    const totalHits = data.fullsize || 0;
    const displayedHits = data.Lines ? data.Lines.length : 0;
    statsContainer.innerHTML = `
      <div class="stats">
        <span>Showing <strong>${displayedHits}</strong> out of <strong>${totalHits}</strong> results (${uniqueJadIds.size} unique passages)</span>
      </div>
    `;
  }

  displayPagination(data) {
    const paginationContainer = document.getElementById(this.paginationId);
    if (!paginationContainer) return;
    const totalHits = data.fullsize || 0;
    const totalPages = Math.ceil(totalHits / this.pagesize);
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }
    let html = '<div class="pagination">';
    if (this.currentPage > 1) {
      html += `<button class="page-btn" data-page="${
        this.currentPage - 1
      }">← Previous</button>`;
    }
    html += `<span class="page-info">Page ${this.currentPage} of ${totalPages}</span>`;
    if (this.currentPage < totalPages) {
      html += `<button class="page-btn" data-page="${
        this.currentPage + 1
      }">Next →</button>`;
    }
    html += "</div>";
    paginationContainer.innerHTML = html;
    paginationContainer.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const page = parseInt(e.target.dataset.page);
        this.executeSearch(page);
      });
    });
  }

  showLoading() {
    const resultsContainer = document.getElementById(this.resultsId);
    if (resultsContainer) {
      resultsContainer.innerHTML = "<p>Loading...</p>";
    }
  }

  showError(message) {
    const resultsContainer = document.getElementById(this.resultsId);
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p class="error">Error: ${message}</p>`;
    }
  }
}

export default CustomNoskeSearch;
