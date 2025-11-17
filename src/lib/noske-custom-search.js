// Custom NoSketch Engine Search Implementation
// Based on: https://raw.githubusercontent.com/acdh-oeaw/noske-ubi9/main/openapi/openapi.yaml

class CustomNoskeSearch {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.corpname = config.corpname;
    this.attrs = config.attrs || "word,lemma,pos";
    this.refs = config.refs || "doc#";
    this.structs = config.structs || "doc,p";
    this.viewmode = config.viewmode || "sen";
    this.pagesize = config.pagesize || 20;

    // Search type: 'simple', 'cql', 'lemma', 'phrase', 'word'
    this.searchType = config.searchType || "simple";

    // HTML element IDs
    this.searchInputId = config.searchInputId;
    this.searchButtonId = config.searchButtonId;
    this.searchTypeSelectId = config.searchTypeSelectId; // ✅ FIXED: Added this
    this.resultsId = config.resultsId;
    this.statsId = config.statsId;
    this.paginationId = config.paginationId;

    this.currentPage = 1;
    this.currentResults = null;

    this.init();
  }

  init() {
    // Set up event listeners
    const searchButton = document.getElementById(this.searchButtonId);
    const searchInput = document.getElementById(this.searchInputId);
    const searchTypeSelect = document.getElementById(this.searchTypeSelectId); // ✅ FIXED: Get the dropdown

    if (searchButton) {
      searchButton.addEventListener("click", () => this.executeSearch());
    }

    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.executeSearch();
        }
      });
    }

    // ✅ FIXED: Listen for dropdown changes
    if (searchTypeSelect) {
      searchTypeSelect.addEventListener("change", (e) => {
        this.searchType = e.target.value;
        console.log(`Search type changed to: ${this.searchType}`);
      });
    }
  }

  // ✅ FIXED: Changed signature and added logic to read from input
  async executeSearch(page = 1) {
    const searchInput = document.getElementById(this.searchInputId);
    const query = searchInput ? searchInput.value : "";

    if (!query) {
      console.warn("No search query provided");
      return;
    }

    this.currentPage = page;

    // Show loading state
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
    // Build the query parameter based on search type
    let queryParam;

    switch (this.searchType) {
      case "cql":
        queryParam = query;
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
        queryParam = `[word="${query}"]`;
        break;

      case "simple":
      default:
        queryParam = `q[word="${query}"]`;
        break;
    }

    // Build the concordance query URL
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
      asyn: 0, // Wait for complete results
    });

    const url = `${
      this.baseUrl
    }/bonito/run.cgi/concordance?${params.toString()}`;

    console.log("=== SEARCH REQUEST ===");
    console.log("Search Type:", this.searchType);
    console.log("Query:", query);
    console.log("Query Param:", queryParam);
    console.log("URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("=== SEARCH RESPONSE ===");
    console.log("Full response:", data);

    if (data.Lines && data.Lines.length > 0) {
      console.log("=== FIRST HIT ===");
      console.log("Full line:", data.Lines[0]);
      console.log("Refs:", data.Lines[0].Refs);
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

    // Build HTML for results
    let html = '<div class="search-results">';

    data.Lines.forEach((line, index) => {
      // Build the text from Left, Kwic, Right
      const leftText = this.buildText(line.Left);
      const kwicText = this.buildText(line.Kwic);
      const rightText = this.buildText(line.Right);

      html += `
        <div class="result-item">
          <div class="result-text">
            <span class="left-context">${leftText}</span>
            <span class="kwic">${kwicText}</span>
            <span class="right-context">${rightText}</span>
          </div>
        </div>
      `;
    });

    html += "</div>";
    resultsContainer.innerHTML = html;
  }

  buildText(tokenArray) {
    if (!tokenArray || tokenArray.length === 0) return "";

    // Each token has: {str: "word", attr: {word: "word", lemma: "word", pos: "NN"}}
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

    // Previous button
    if (this.currentPage > 1) {
      html += `<button class="page-btn" data-page="${
        this.currentPage - 1
      }">← Previous</button>`;
    }

    // Page info
    html += `<span class="page-info">Page ${this.currentPage} of ${totalPages}</span>`;

    // Next button
    if (this.currentPage < totalPages) {
      html += `<button class="page-btn" data-page="${
        this.currentPage + 1
      }">Next →</button>`;
    }

    html += "</div>";
    paginationContainer.innerHTML = html;

    // Add click handlers for pagination buttons
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

// Export for use in your project
export default CustomNoskeSearch;
