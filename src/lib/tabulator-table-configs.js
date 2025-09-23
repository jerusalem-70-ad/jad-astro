// Configuration for Tabulator tables for passages

export const passagesTableConfig = {
  transformData: (passages) => {
    return passages.map((passage) => {
      const work_position =
        passage.work
          .map((work) => {
            const title = work.title;
            const position = passage.position_in_work;
            const page = passage.text_paragraph?.match(/p\. (\d+\w?)/)?.[1]; // get first page like '0246C'

            if (position && page) {
              return `${title}: ${position} (p. ${page})`;
            } else if (position) {
              return `${title}: ${position}`;
            } else if (page) {
              return `${title} (p. ${page})`;
            } else {
              return title;
            }
          })
          .join("; ") || "";
      return {
        jad_id: passage.jad_id || "",
        id: passage.id || "",
        passage: passage.passage || "",
        aut_name: passage.work[0]?.author[0]?.name || "",
        alt_name: passage.work[0]?.author[0]?.alt_name || "",
        work: passage.work[0]?.title || "",
        work_position: work_position || "",
        mss_occurrences: passage.mss_occurrences
          .map((ms) => ms.manuscript)
          .join(" | "),
        biblical_references: passage.biblical_references
          .map((ref) => ref.value)
          .join(" | "),
        liturgical_references: passage.liturgical_references
          .map((ref) => ref.value)
          .join(" | "),
        keywords: passage.keywords.map((kw) => kw.value).join(" | ") || "",
        transmission_graph:
          passage.transmission_graph.graph.nodes.length - 1 || 0,
      };
    });
  },

  getColumns: () => {
    const columns = [
      {
        title: "ID",
        resizable: true,
        field: "id",
        width: 80,
        headerFilter: "input",
      },
      {
        title: "Passage",
        field: "passage",
        responsive: 1,
        widthGrow: 3,
        minWidth: 150,
      },
      {
        title: "Author",
        field: "aut_name", //using custom filter to check also alt_name
        resposive: 1,
        widthGrow: 2,
        minWidth: 150,
      },
      {
        title: "Work",
        resizable: true,
        field: "work_position",
        minWidth: 200,
        headerFilter: "input",
      },
      {
        title: "Manuscript",
        resizable: true,
        field: "mss_occurrences",
        minWidth: 200,
      },

      {
        title: "Biblical Reference",
        resizable: true,
        field: "biblical_references",
        minWidth: 200,
      },
      {
        title: "Liturgical Reference",
        resizable: true,
        field: "liturgical_references",
        minWidth: 200,
      },
      {
        title: "Keywords",
        resizable: true,
        field: "keywords",
        minWidth: 200,
        headerFilter: "input",
      },
      {
        title: "related passages",
        headerTooltip:
          "Sources of this passage, or passages that cite this one",
        resizable: true,
        field: "transmission_graph",
        minWidth: 60,
        headerFilter: "number",
      },
    ];

    return addHeaderFilters(columns);
  },
  // Row click configuration for passages table
  getRowClickConfig: {
    urlPattern: "/passages/{id}",
    idField: "jad_id",
    target: "_self",
  },
};

// Configuration for Tabulator tables in authors
export const authorsTableConfig = {
  transformData: (authors) => {
    return authors
      .filter((aut) => aut.name)
      .map((aut) => {
        return {
          id: aut.id || "",
          aut_name: aut.name || "",
          alt_name: aut.alt_name || "",
          works: aut.works.map((w) => w.title).join(" | ") || "",
          jad_id: aut.jad_id || "",
          place: aut.place.map((pl) => pl.value).join(" | ") || "",
        };
      });
  },

  getColumns: () => {
    const columns = [
      {
        title: "Name",
        field: "aut_name",
        responsive: 1,
        widthGrow: 1,
        minWidth: 200,
      },
      {
        title: "Works",
        field: "works",
        responsive: 0,
        widthGrow: 2,
        minWidth: 250,
      },
      {
        title: "Place",
        field: "place",
        responsive: 2,
        widthGrow: 1,
        minWidth: 100,
      },
    ];

    return addHeaderFilters(columns);
  },
  // Row click configuration for work-mss-transmission table
  getRowClickConfig: {
    urlPattern: "/authors/{id}",
    idField: "jad_id",
    target: "_self",
  },
};

// Configuration for Tabulator tables in works
export const worksTableConfig = {
  transformData: (works) => {
    return works.map((work) => {
      const totalPassages = work.related__passages
        .map((positionObj) => positionObj.passages.length)
        .reduce((total, count) => total + count, 0);
      return {
        id: work.id || "",
        jad_id: work.jad_id || "",
        title: work.title || "",
        aut_name: work.author.map((a) => a.name).join(", "),
        alt_name: work.author[0].alt_name || "",
        genre: work.genre,
        ms_transmission: work.manuscripts.map((ms) => ms.name).join(" | "),
        related_passages: totalPassages,
        institutional_context: (work.institutional_context || [])
          .map((context) => context.value)
          .join(" | "),
        origDate: work.date,
      };
    });
  },

  getColumns() {
    const columns = [
      {
        title: "Titel",
        field: "title",
        responsive: 1,
        widthGrow: 3,
        minWidth: 150,
      },
      {
        title: "Autor",
        field: "aut_name", //using custom filter to check also alt_name
        minWidth: 100,
        widthGrow: 2,
        responsive: 1,
      },
      {
        title: "Genre",
        field: "genre",
        minWidth: 150,
        widthGrow: 1,
        responsive: 2,
      },
      {
        title: "Manuscripts",
        field: "ms_transmission",
        minWidth: 150,
        widthGrow: 1,
        responsive: 2,
      },
      {
        title: "Passages",
        field: "related_passages",
        minWidth: 100,
        responsive: 2,
      },
      {
        title: "Context",
        field: "institutional_context",
        minWidth: 150,
        responsive: 2,
      },
      {
        title: "Date",
        field: "origDate",
        headerFilterPlaceholder: "e.g. 1000, after 1001",
        minWidth: 150,
        responsive: 2,
      },
    ];
    return addHeaderFilters(columns);
  },
  // Row click configuration for work-mss-transmission table
  getRowClickConfig: {
    urlPattern: "/works/{id}",
    idField: "jad_id",
    target: "_self",
  },
};

export const manuscriptsTableConfig = {
  transformData: (mss) => {
    return mss
      .filter((ms) => ms.name[0].value)
      .map((ms) => {
        return {
          id: ms.id || "",
          ms_name: ms.name[0].value || "",
          settlement: ms.library[0]?.place[0].value || "",
          related_works:
            ms.related_works
              .map((w) => (w.author ? `${w.author.name}: ${w.title}` : w.title))
              .join(" | ") || "",
          related_passages:
            ms.related_passages
              .map(
                (rel_p) =>
                  `(${rel_p.passage.id}) ${rel_p.passage.passage.substring(
                    0,
                    50
                  )}${rel_p.passage.passage.length > 50 ? "..." : ""}`
              )
              .join("\n") || "",

          jad_id: ms.jad_id || "",
          institutional_context:
            ms.institutional_context
              .map((context) => context.value)
              .join(" | ") || "",
          origDate: ms.date_written || "",
        };
      });
  },

  getColumns: () => {
    const columns = [
      {
        title: "Settlement",
        field: "settlement",
        width: 150,
      },
      {
        title: "Shelfmark",
        field: "ms_name",
        width: 150,
      },
      {
        title: "Works",
        field: "related_works",
      },
      {
        title: "Passages",
        field: "related_passages",
        minWidth: 300,
        formatter: "textarea",
      },
      {
        title: "Institutional context",
        resizable: true,
        field: "institutional_context",
      },
      {
        title: "Date",
        resizable: true,
        field: "origDate",
        headerFilterPlaceholder: "e.g. 1000, after 1001",
      },
    ];

    return addHeaderFilters(columns);
  },
  // Row click configuration for work-mss-transmission table
  getRowClickConfig: {
    urlPattern: "/manuscripts/{id}",
    idField: "jad_id",
    target: "_self",
  },
};

export const keywordsTableConfig = {
  transformData: (keywords) => {
    return keywords.map((kw) => {
      return {
        id: kw.id || "",
        name: kw.name || "",
        description: kw.description || "",
        related_passages:
          kw.passages
            .map(
              (p) =>
                `(${p.id}) ${p.passage.substring(0, 50)}${
                  p.passage.length > 50 ? "..." : ""
                }`
            )
            .join(" | ") || "",

        jad_id: kw.jad_id || "",
        relatedPassagesLength: kw.passages.length || 0,
      };
    });
  },

  getColumns: () => {
    const columns = [
      {
        title: "Name",
        resizable: true,
        field: "name",
        responsive: 1,
        widthGrow: 2,
      },
      {
        title: "info",
        resizable: true,
        field: "description",
        responsive: 1,
        widthGrow: 3,
      },
      {
        title: "occurrences",
        field: "relatedPassagesLength",
        headerFilter: "number",
        responsive: 1,
        widthGrow: 1,
      },

      {
        title: "Passages",
        field: "related_passages",
        responsive: 2,
        widthGrow: 3,
        formatter: "textarea",
      },
    ];

    return addHeaderFilters(columns);
  },
  // Row click configuration for work-mss-transmission table
  getRowClickConfig: {
    urlPattern: "/keywords/{id}",
    idField: "jad_id",
    target: "_self",
  },
};

// Helper function to add header filters to columns
function addHeaderFilters(columns) {
  return columns.map((column) => ({
    headerFilter: "input", // Default
    headerFilterPlaceholder: "Search ...", // Default
    ...column,
  }));
}
