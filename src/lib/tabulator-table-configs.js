// Configuration for Tabulator tables in work detail pages
export const workDetailTableConfig = {
  transformData: (msTransmission) => {
    return msTransmission.map((item) => ({
      manuscript: item.manuscript[0]?.value || "",
      manuscriptId: item.manuscript[0]?.id || "",
      locus: item.locus || "",
      hit_id: item.hit_id || "",
      role: item.role || "",
      function: item.function || "",
      origPlace: [
        ...new Set(
          item.orig_place.flatMap((p) => p.place.map((pl) => pl.value))
        ),
      ].join(", "),
      origDate: [
        ...new Map(
          item.orig_date.flatMap((d) => d.date).map((date) => [date.id, date]) // Use ID as a unique key
        ).values(),
      ],
      annotationDate: [
        ...new Set(
          item.annotation_date.flatMap((anDat) =>
            anDat.date.map((d) => d.value)
          )
        ),
      ].join(" | "),
      annotationType: [...new Set(item.annotation_typ)].join(" | "),
      version: [...new Set(item.version.map((ver) => ver.value))].join(" | "),
      textModification: [...new Set(item.text_modification)].join(" | "),
      decoration: [...new Set(item.decoration.map((deco) => deco.value))].join(
        " | "
      ),
      form: [...new Set(item.form.map((f) => f.value))].join(" | "),
    }));
  },

  getColumns: (
    hasRole = false,
    hasVersion = false,
    hasTextModification = false,
    hasForm = false,
    hasAnnotationType = false,
    hasAnnotationDate = false
  ) => {
    const baseColumns = [
      {
        title: "Handschrift",
        field: "manuscript",
        responsive: 0,

        widthGrow: 3,
        minWidth: 150,
      },
      {
        title: "Locus",
        field: "locus",
        responsive: 0,
        widthGrow: 1,
        minWidth: 80,
      },
      ...(hasRole
        ? [
            {
              title: "Role",
              field: "role",
              responsive: 3,
              minWidth: 150,
            },
          ]
        : []),
      {
        title: "Schreibort",
        field: "origPlace",
        responsive: 1,
        widthGrow: 2,
        minWidth: 150,
      },
      {
        title: "Datierung",
        field: "origDate",
        responsive: 2,
        headerFilterPlaceholder: "z.B. vor 1000",
        widthGrow: 1,
        minWidth: 150,
      },
      ...(hasAnnotationDate
        ? [
            {
              title: "Annotationen - Datierung",
              field: "annotationDate",
              responsive: 3,
              minWidth: 150,
            },
          ]
        : []),
      ...(hasAnnotationType
        ? [
            {
              title: "Annotationen - Typ",
              field: "annotationType",
              responsive: 2,
              widthGrow: 2,
              minWidth: 150,
              formatter: "textarea",
            },
          ]
        : []),

      ...(hasForm
        ? [
            {
              title: "Form",
              field: "form",
              responsive: 3,
              widthGrow: 2,
              minWidth: 150,
            },
          ]
        : []),
      ...(hasVersion
        ? [
            {
              title: "Version",
              field: "version",
              responsive: 3,
              widthGrow: 2,
              minWidth: 150,
              formatter: "textarea",
            },
          ]
        : []),
      ...(hasTextModification
        ? [
            {
              title: "Textmodifikation",
              field: "textModification",
              responsive: 3,
              widthGrow: 2,
              minWidth: 120,
              formatter: "textarea",
            },
          ]
        : []),
    ];

    return addHeaderFilters(baseColumns);
  },

  // Row click configuration for work-mss-transmission table
  getRowClickConfig: () => ({
    urlPattern: "/msitems/{id}",
    idField: "hit_id",
    target: "_self",
  }),
};

// Configuration for Tabulator tables in authors
export const authorsTableConfig = {
  transformData: (authors) => {
    return authors
      .filter((aut) => aut.name)
      .map((aut) => {
        return {
          id: aut.id || "",
          name: aut.name || "",
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
        field: "name",
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
      const orgDate = [
        ...new Map(
          work.ms_transmission
            .flatMap((ms) => ms.orig_date.flatMap((d) => d.date))
            .map((date) => [date.id, date]) // Use ID as a unique key
        ).values(),
      ];
      const orgPlace = [
        ...new Set(
          work.ms_transmission.flatMap((ms) =>
            ms.orig_place.flatMap((p) => p.place.map((place) => place.value))
          )
        ),
      ].join(" | ");
      const provenance = [
        ...new Set(
          work.ms_transmission.flatMap((ms) =>
            ms.provenance.flatMap((placement) =>
              placement.places.map((place) => place.value)
            )
          )
        ),
      ].join(", ");
      return {
        id: work.id || "",
        hit_id: work.hit_id || "",
        title: work.title || "",
        author: [...new Set(work.author.map((a) => a.name))].join(", "),
        genre: [...new Set(work.genre.map((g) => g.value))].join(", "),
        ms_transmission: [
          ...new Set(work.ms_transmission.map((m) => m.manuscript[0]?.value)),
        ].join(", "),
        origPlace: orgPlace,
        provenance: provenance,
        origDate: orgDate,
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
        field: "author",
        headerFilterPlaceholder: "e.g. Isidor",
        minWidth: 100,
        widthGrow: 2,
        responsive: 1,
      },
      {
        title: "Genre",
        field: "genre",
        headerFilter: "list",
        headerFilterParams: {
          valuesLookup: true,
          clearable: true,
          sort: "asc",
        },
        minWidth: 150,
        widthGrow: 1,
        responsive: 2,
      },
      {
        title: "Überlieferung",
        field: "ms_transmission",
        headerFilterPlaceholder: "e.g. Clm. 6380",
        minWidth: 150,
        headerFilter: "input",
        formatter: "textarea",
        widthGrow: 1,
        responsive: 2,
      },
      {
        title: "Entstehungsort",
        field: "origPlace",
        headerFilterPlaceholder: "e.g. Reims",
        minWidth: 150,
        formatter: "textarea",
        responsive: 2,
      },
      {
        title: "Provenienz",
        field: "provenance",
        headerFilterPlaceholder: "e.g. Freising",
        minWidth: 150,
        formatter: "textarea",
        responsive: 2,
      },
      {
        title: "Datum",
        field: "origDate",
        headerFilterPlaceholder: "e.g. 850, nach 850",
        minWidth: 150,
        // Ensures filtering and sorting work correctly

        responsive: 2,
      },
    ];
    return addHeaderFilters(columns);
  },
  // Row click configuration for work-mss-transmission table
  getRowClickConfig: {
    urlPattern: "/works/{id}",
    idField: "hit_id",
    target: "_self",
  },
};

export const strataTableConfig = {
  transformData: (strata) => {
    return strata.map((stratum) => {
      const origDate = [
        ...new Map(
          stratum.date.map((date) => [date.id, date]) // Use ID as a unique key
        ).values(),
      ];
      return {
        id: stratum.id || "",
        hit_id: stratum.hit_id || "",
        manuscript: stratum.manuscript[0]?.value || "",
        number: stratum.number || "",
        character: stratum.character.join(" | ") || "",
        texts: [...new Set(stratum.msitems.map((item) => item.w_aut))].join(
          "\n"
        ),
        origDate: origDate,
        place: stratum.place.map((pl) => pl.value).join(" | ") || "",
      };
    });
  },

  getColumns() {
    const columns = [
      {
        title: "Handschrift",
        field: "manuscript",
        headerFilterPlaceholder: "e.g. Clm. 6380",
        minWidth: 150,
        widthGrow: 1,
        responsive: 0,
      },
      {
        title: "Stratum",
        field: "number",
        headerFilterPlaceholder: "e.g. 1",
        minWidth: 80,
        widthGrow: 1,
        responsive: 1,
      },

      {
        title: "Texte",
        field: "texts",
        headerFilterPlaceholder: "e.g. Ostertafel",
        minWidth: 150,
        formatter: "textarea",
        widthGrow: 3,
        responsive: 2,
      },
      {
        title: "Charakter",
        field: "character",
        headerFilterPlaceholder: "e.g. Anlage",
        minWidth: 150,
        formatter: "textarea",
        widthGrow: 2,
        responsive: 2,
      },
      {
        title: "Datum",
        headerTooltip: "Datierung der beteiligten Hände",
        field: "origDate",
        headerFilterPlaceholder: "e.g. 850, nach 850",
        minWidth: 150,
        responsive: 2,
        widthGrow: 1,
      },
      {
        title: "Ort",
        field: "place",
        headerFilterPlaceholder: "e.g. Reims",
        minWidth: 150,
        formatter: "textarea",
        responsive: 2,
      },
    ];
    return addHeaderFilters(columns);
  },
  // Row click configuration for strata table
  getRowClickConfig: {
    urlPattern: "/strata/{id}",
    idField: "hit_id",
    target: "_self",
  },
};

export const msItemsTableConfig = {
  transformData: (msitems) => {
    return msitems.map((item) => {
      const origDate = [
        ...new Map(
          item.orig_date.flatMap((dating) =>
            dating.date?.map((date) => [date.id, date])
          ) || []
        ).values(),
      ];
      const editDate = [
        ...new Map(
          item.hands
            .filter((hand) =>
              hand.jobs.some((j) => j.role.some((r) => r.value !== "Schreiber"))
            )
            .flatMap((hand) =>
              hand.dating.flatMap((dat) =>
                dat.date.map((date) => [date.id, date])
              )
            ) || []
        ).values(),
      ];
      return {
        id: item.id || "",
        hit_id: item.hit_id || "",
        manuscript: item.manuscript[0].value,
        locus: item.locus || "",
        work:
          item.title_work[0].author?.length > 0
            ? `${item.title_work[0].author[0].name}: ${item.title_work[0].title}`
            : item.title_work[0].title,
        decoration: item.decoration.map((deco) => deco.value).join(" | "),
        origPlace: [
          ...new Set(
            item.orig_place.flatMap((placement) =>
              placement.place.map((place) => place.value)
            )
          ),
        ].join(" | "),
        origDate: origDate,
        editDate: editDate,
        // Add other fields as needed
      };
    });
  },

  getColumns() {
    const columns = [
      {
        title: "Handschrift",
        field: "manuscript",
        minWidth: 200,
        responsive: 0,
      },
      {
        title: "Locus",
        field: "locus",
        minWidth: 80,
        responsive: 2,
      },
      {
        title: "Werk",
        field: "work",
        minWidth: 200,
        responsive: 1,
      },
      {
        title: "Dekoration",
        field: "decoration",
        minWidth: 100,
        responsive: 2,
      },
      {
        title: "Schreiberort",
        field: "origPlace",
        minWidth: 200,
        responsive: 2,
      },
      {
        title: "Datum der Niederschrift",
        field: "origDate",
        headerFilterPlaceholder: "e.g. nach 810",
        responsive: 2,
      },

      {
        title: "Datum der Bearbeitung",
        field: "editDate",
        minWidth: 200,
        headerFilterPlaceholder: "e.g. nach 810",
        responsive: 2,
      },
    ];
    return addHeaderFilters(columns);
  },
  // Row click configuration for strata table
  getRowClickConfig: {
    urlPattern: "/msitems/{id}",
    idField: "hit_id",
    target: "_self",
  },
};

// Helper function to add header filters to columns
function addHeaderFilters(columns) {
  return columns.map((column) => ({
    ...column, // Spread column properties first
    headerFilter: column.headerFilter || "input", // Only set if not already defined
    headerFilterPlaceholder: column.headerFilterPlaceholder || "Filtern ...", // Only set if not already defined
  }));
}
