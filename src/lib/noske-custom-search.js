// Custom NoSketch Engine Search Implementation
// Based on: https://raw.githubusercontent.com/acdh-oeaw/noske-ubi9/main/openapi/openapi.yaml
import tsNoskeSearch from "@/lib/ts-search-noske.js";

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
      this.displayResults(results);
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

  displayResults(data) {
    const resultsContainer = document.getElementById(this.resultsId);
    if (!resultsContainer) return;

    if (!data.Lines || data.Lines.length === 0) {
      resultsContainer.innerHTML = "<p>No results found.</p>";
      return;
    }

    let html = '<div class="search-results">';

    data.Lines.forEach((line, index) => {
      const leftText = this.buildText(line.Left);
      const kwicText = this.buildText(line.Kwic);
      const rightText = this.buildText(line.Right);
      // Extract jad_id from landingPageURI
      const jad_id =
        line.Kwic[0].attr.split("passages/")[1].split(".html")[0] || "#";

      html += `
        <div class="result-item">
          <div class="result-text">
            <span class="left-context">${leftText}</span>
            <span class="kwic">${kwicText}</span>
            <span class="right-context">${rightText}</span>
          </div> 
            <div class="ts-details flex justify-between mt-4" data-id="${jad_id}"></div>       
        </div>
      `;
    });

    html += "</div>";
    resultsContainer.innerHTML = html;

    resultsContainer.querySelectorAll(".ts-details").forEach((div) => {
      const rec_id = div.getAttribute("data-id");
      tsNoskeSearch(rec_id, div);
    });
  }

  buildText(tokenArray) {
    if (!tokenArray || tokenArray.length === 0) return "";
    return tokenArray.map((token) => token.str).join(" ");
  }

  displayStats(data) {
    const statsContainer = document.getElementById(this.statsId);
    if (!statsContainer) return;
    const totalHits = data.fullsize || 0;
    const displayedHits = data.Lines ? data.Lines.length : 0;
    statsContainer.innerHTML = `
      <div class="stats">
        <span>Showing <strong>${displayedHits}</strong> out of <strong>${totalHits}</strong> results</span>
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
