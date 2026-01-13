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
        aut_jad_id: passage.work[0]?.author[0]?.jad_id,
        ms_jad_ids:
          passage.mss_occurrences?.map((occ) => occ.manuscript_jad_id) || [],
        work: passage.work[0]?.title || "",
        work_position: work_position || "",
        mss_occurrences: passage.mss_occurrences
          .map((ms) => ms.manuscript)
          .join(" | "),
        keywords: passage.keywords.map((kw) => kw.value).join(" | ") || "",
        origDate: passage.work[0].date || "",
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
        minWidth: 200,
      },
      {
        title: "Author",
        field: "aut_name", //using custom filter to check also alt_name
        responsive: 1,
        widthGrow: 2,
        minWidth: 200,
      },
      {
        title: "Work",
        resizable: true,
        field: "work_position",
        responsive: 1,
        widthGrow: 2,
        minWidth: 200,
      },
      {
        title: "Manuscript",
        resizable: true,
        field: "mss_occurrences",
        widthGrow: 2,
        responsive: 3,
        minWidth: 200,
      },

      /*  {
        title: "Biblical Reference",
        resizable: true,
        field: "biblical_references",
        responsive: 4,
        widthGrow: 1,
        minWidth: 100,
      },
      {
        title: "Liturgical Reference",
        resizable: true,
        field: "liturgical_references",
        responsive: 4,
        widthGrow: 1,
        minWidth: 100,
      }, */
      {
        title: "Keywords",
        resizable: true,
        field: "keywords",
        responsive: 2,
        widthGrow: 2,
        minWidth: 150,
      },
      {
        title: "Date",
        field: "origDate",
        headerFilterPlaceholder: "e.g. 1000, after 1001",
        responsive: 2,
        widthGrow: 2,
        minWidth: 200,
      },
      {
        title: "related passages",
        headerTooltip:
          "Sources of this passage, or passages that cite this one",
        field: "transmission_graph",
        headerFilter: "number",
        responsive: 3,
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
        const passages =
          ms.related_passages?.length > 0
            ? `<ul>${ms.related_passages
                .filter((p) => p.passage?.length > 0)
                .map(
                  (p) => `<li>(${p.passage[0].id}) ${p.passage[0].passage}</li>`
                )
                .join("")}</ul>`
            : "";

        return {
          id: ms.id || "",
          ms_name: ms.name[0].value || "",
          settlement: ms.library[0]?.place[0].value || "",
          related_works:
            ms.related_works
              .map((w) => (w.author ? `${w.author.name}: ${w.title}` : w.title))
              .join(" | ") || "",
          related_passages: passages,

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
      const passages =
        (kw.passages.length > 0 &&
          `<ul>${kw.passages
            .map((p) => `<li>(${p.id}) ${p.passage})</li>`)
            .join("")}</ul>`) ||
        [];
      return {
        id: kw.id || "",
        name: kw.name || "",
        description: kw.description || "",
        related_passages: passages,
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
        title: "Info",
        resizable: true,
        field: "description",
        responsive: 1,
        widthGrow: 3,
        formatter: "textarea",
      },
      {
        title: "Occurrences",
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
// Configuration for Tabulator tables in biblical references
export const biblrefsTableConfig = {
  transformData: (biblrefs) => {
    return biblrefs.map((ref) => {
      const totalPassages = ref.related_passages?.length;
      const works = [
        ...new Map(
          ref.related_passages.map((p) => p.work[0])?.map((w) => [w.id, w])
        ).values(),
      ];
      const worksList =
        works.length === 0
          ? "N/A"
          : works
              .map(
                (w) =>
                  `${w.author?.[0]?.name ? w.author[0].name + ": " : ""}${
                    w.title
                  }`
              )
              .join("\n");
      const book = ref.name?.split(" ")?.[0] || "";
      const chapterVerseMatch = ref.name?.match(/(\d+),(\d+)/);
      const chapter = chapterVerseMatch ? chapterVerseMatch[1] : "";
      const verse = chapterVerseMatch ? chapterVerseMatch[2] : "";
      return {
        id: ref.id || "",
        jad_id: ref.jad_id || "",
        title: ref.name || "",
        text: ref.text || "",
        works: worksList,
        related_passages: totalPassages,
        book: book,
        chapter: chapter,
        verse: verse,
      };
    });
  },

  getColumns() {
    const columns = [
      {
        title: "Book",
        field: "book",
        responsive: 1,
        widthGrow: 1,
        minWidth: 50,
      },
      {
        title: "Chapter",
        field: "chapter",
        responsive: 1,
        widthGrow: 1,
        minWidth: 50,
      },
      {
        title: "Verse",
        field: "verse",
        responsive: 1,
        widthGrow: 1,
        minWidth: 50,
      },
      {
        title: "Vulgata Text",
        field: "text",
        minWidth: 100,
        widthGrow: 3,
        responsive: 1,
      },
      {
        title: "Works",
        field: "works",
        minWidth: 150,
        widthGrow: 3,
        responsive: 2,
        formatter: "textarea",
      },

      {
        title: "Passages",
        field: "related_passages",
        minWidth: 100,
        responsive: 2,
      },
    ];
    return addHeaderFilters(columns);
  },
  // Row click configuration for work-mss-transmission table
  getRowClickConfig: {
    urlPattern: "/biblical-refs/{id}",
    idField: "jad_id",
    target: "_self",
  },
};

// Configuration for Tabulator tables in biblical references detail view page
export const biblrefTableConfig = {
  transformData: (passages) => {
    return passages.map((passage) => {
      const work_title = passage.work[0]?.title || "";
      const author = passage.work?.[0]?.author?.[0]
        ? `${passage.work[0].author[0].name}${
            passage.work[0].author[0].alt_name
              ? ` (${passage.work[0].author[0].alt_name})`
              : ""
          }`
        : "";

      return {
        id: passage.id,
        jad_id: passage.jad_id,
        title_work: work_title,
        passage: passage.passage,
        aut_name: passage.work[0].author.map((a) => a.name).join(", "),
        alt_name: passage.work[0].author[0].alt_name || "",
        position: passage.position_in_work,
      };
    });
  },

  getColumns() {
    const columns = [
      {
        title: "#",
        field: "id",
        responsive: 1,
        widthGrow: 1,
        maxWidth: 40,
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
        field: "aut_name",
        minWidth: 100,
        widthGrow: 2,
        responsive: 2,
        formatter: "textarea",
      },
      {
        title: "Work",
        field: "title_work",
        minWidth: 100,
        widthGrow: 2,
        responsive: 1,
      },

      {
        title: "Position in Work",
        field: "position",
        minWidth: 50,
        responsive: 2,
      },
    ];
    return addHeaderFilters(columns);
  },
  // Row click configuration for work-mss-transmission table
  getRowClickConfig: {
    urlPattern: "/passages/{id}",
    idField: "jad_id",
    target: "_self",
  },
};
