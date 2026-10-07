import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  enrichDates,
  normalizeText,
  enrichPlaces,
  enrichLibraries,
  addPrevNextToItems,
} from "./utils.js";
import { processBibleReference } from "./helpers.ts";
import { buildTransmissionGraph } from "./build-transmission-graph.js";
import {
  generateBiblicalSortKey,
  calculateSortPosition,
} from "./sort-bibl-ref.js";

const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "src/content/row", file), "utf8"),
  );

const passages = Object.values(loadJSON("occurrences.json"));
const dates = Object.values(loadJSON("date.json"));
const biblicalRef = Object.values(loadJSON("biblical_references.json"));
const manuscripts = Object.values(loadJSON("manuscripts.json"));
const msOccurrences = Object.values(loadJSON("ms_occurrences.json"));
const works = Object.values(loadJSON("works.json"));
const authors = Object.values(loadJSON("authors.json"));
const places = Object.values(loadJSON("places.json"));
const libraries = Object.values(loadJSON("libraries.json"));
const clusters = Object.values(loadJSON("cluster.json"));
const liturgical_references = Object.values(
  loadJSON("liturgical_references.json"),
);
const institutional_contexts = Object.values(
  loadJSON("institutional_context.json"),
);

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "data");
mkdirSync(folderPath, { recursive: true });

// function to write the files
const writeJson = (fileName, data) => {
  try {
    writeFileSync(
      join(folderPath, `${fileName}.json`),
      JSON.stringify(data, null, 2),
      { encoding: "utf-8" },
    );
    console.log(`Wrote ${data.length} items to ${fileName}.json`);
  } catch (error) {
    console.error(`Could not write ${fileName}.json`);
    throw error;
  }
};

const institutionalContextsClean = institutional_contexts
  .filter((context) => context.name)
  .map(({ order, ...rest }) => rest)
  .map((context) => {
    return {
      id: context.id,
      jad_id: context.jad_id,
      name: context.name,
      part_of: context.part_of.map(({ order, ...rest }) => rest) || "",
      place: enrichPlaces(context.place, places) || [],
    };
  });

writeJson("institutional_context", institutionalContextsClean);

// enrich places with geonames_url, jad_id, lat, long from places.json
// used in authors.json and manuscripts.json

// create map for authros to use in instant search to match the search normalized field
// and use the normal name for display

const authorMapObject = {};
authors.forEach((aut) => {
  const normalizedKey = aut.name
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(",", "");
  authorMapObject[normalizedKey] = aut.name;
});

// Write as JSON file

writeJson("authors_map", authorMapObject);

// enrich authors with places and transform dates
//helper function to remove leading zeros from date ranges and month days

function formatDate(date) {
  if (date === null || date === undefined) {
    return "";
  }
  if (date.includes("-")) {
    return date.split("-")[-1];
  }
  return (
    date.toString().replace(/^0+/, "") || "0" // Remove leading zeros
  );
}

const authorsPlus = authors
  .filter((aut) => aut.name) // filter out authors without a name
  .map((aut) => {
    const date_birth = aut.date_of_birth
      ? formatDate(aut.date_of_birth)
      : "unknown";
    const date_death = aut.date_of_death
      ? formatDate(aut.date_of_death)
      : "unknown";
    const raw_dates = [
      {
        not_before: aut.date_of_birth || "",
        not_after: aut.date_of_death || "",
        range:
          aut.date_of_birth || aut.date_of_death
            ? `${aut.date_of_birth || "?"}-${aut.date_of_death || "?"}`
            : "",
      },
    ];
    const bdates = aut.date_birth_certainty ? date_birth : `c. ${date_birth}`;
    const ddates = aut.date_death_certainty ? date_death : `c. ${date_death}`;
    const dates = `${bdates} — ${ddates}`;
    const related_works = works
      .filter((w) => w.author.some((w_aut) => w_aut.id === aut.id))
      .map((work) => {
        return {
          title: work.title,
          id: work.id,
        };
      });
    return {
      id: aut.id,
      jad_id: aut.jad_id,
      name: aut.name.replace(",", ""),
      rawDates: raw_dates,
      origDates: dates,
      place: enrichPlaces(aut.place, places),
      alt_name: aut.alt_name?.replace(",", "") || "",
      notes: aut.notes || "",
      gnd_url: aut.gnd_url || "",
      works: related_works,
      occupation: aut.occupation || "",
    };
  });

const updatedauthors = addPrevNextToItems(authorsPlus, "jad_id", "name");

writeJson("authors", updatedauthors);

// sort biblical references according to nova vulgarta order
const biblicalRefSorted = {};
Object.values(biblicalRef).forEach((ref) => {
  if (ref.name) {
    const sortKey = generateBiblicalSortKey(ref.name);

    biblicalRefSorted[String(ref.id)] = {
      id: ref.id,
      jad_id: ref.jad_id,
      value: ref.name.trim(),
      text: ref.text || "",
      nova_vulgata_url: ref.nova_vulgata_url || "",
      key: sortKey,
    };
  }
});

const manuscriptsPlus = manuscripts
  .filter((ms) => ms.name[0]?.value)
  .map((ms) => {
    return {
      id: ms.id,
      jad_id: ms.jad_id,
      name: ms.name,
      library: enrichLibraries(ms.library, libraries),
      idno: ms.idno,
      catalog_url: ms.catalog_url,
      digi_url: ms.digi_url,
      institutional_context: ms.institutional_context.map(
        ({ order, ...rest }) => rest,
      ),
      format: ms.format,
      date_written: enrichDates(ms.date_written, dates),
    };
  });

const passagesPlus = passages
  .filter((passage) => passage.passage) // filter out empty passages
  .map((passage) => {
    // hierarchical 3-level index for the typesense schema for biblical references
    // level 0 for book (not any more using the bookMap above), lv 1 for chapter, and lv 2 for verse
    const lvl0 = [];
    const lvl1 = [];

    const bible_comm_lvl0 = [];
    const bible_comm_lvl1 = [];

    for (const ref of passage.biblical_references ?? []) {
      const result = processBibleReference(ref);

      lvl0.push(result.lvl0);
      lvl1.push(result.lvl1);
    }

    for (const ref of passage.bible_comm ?? []) {
      const result = processBibleReference(ref);

      bible_comm_lvl0.push(result.lvl0);
      bible_comm_lvl1.push(result.lvl1);
    }
    // enrich the date from dates.json using helper function
    if (passage.work.some((w) => w.date?.length > 0)) {
      passage.work = passage.work.map((w) => ({
        ...w,
        date: enrichDates(w.date, dates),
      }));
    }

    // enrich passage with data from manuscripts.json
    // see if the passage.id is in the ms_occurrences.json
    const msOccurrence = msOccurrences
      .filter(
        (item) =>
          item.occurrence.length > 0 && item.occurrence[0].id === passage.id,
      )
      .map((item) => {
        const mss = manuscriptsPlus
          .filter((ms) => item.manuscript.some((man) => man.id === ms.id))
          // map them to get only the necessary fields
          .map((ms) => {
            return {
              name: `${ms.library[0].place[0]?.value}, ${ms.name[0].value}`,
              jad_id: ms.jad_id,
              lib_place: ms.library[0].place || [],
            };
          });
        return {
          manuscript: mss.map((ms) => ms.name).join(", ") || "TBD",
          jad_id: mss.map((ms) => ms.jad_id).join(", "),
          lib_place: mss.flatMap((ms) => ms.lib_place) || [],
          position_in_ms: item.position_in_ms,
          main_ms: item.main_ms,
          facsimile_position: item.facsimile_position,
          ms_locus: item.ms_locus[0]?.value || "",
        };
      });

    // sort the mss occurrences first if there is a main true, then by library

    const mssSorted = msOccurrence.sort((a, b) => {
      if (a.main_ms && !b.main_ms) return -1;
      if (!a.main_ms && b.main_ms) return 1;

      return a.manuscript
        .normalize("NFKD")
        .replace(/\s+/g, " ")
        .localeCompare(
          b.manuscript.normalize("NFKD").replace(/\s+/g, " "),
          undefined,
          { numeric: true },
        );
    });

    //enrich biblical_references with sort key using the biblicalRefSorted
    if (passage.biblical_references && passage.biblical_references.length > 0) {
      passage.biblical_references = passage.biblical_references.map((ref) => {
        // Find the enriched reference by id (as string, since biblicalRefSorted keys are strings)
        const enriched = biblicalRefSorted[String(ref.id)];
        return {
          ...(enriched || {}), // Merge in all properties from biblicalRefSorted if found
        };
      });
    }
    const workForPassage = passage.work.map((w) => {
      return {
        id: w.id,
        jad_id: w.jad_id,
        title: w.title,
        author: w.author?.map((a) => ({ jad_id: a.jad_id, name: a.name })), // keep only jad_id, and name
        date: w.date,
      };
    });

    const litRefs = liturgical_references
      .filter((ref) =>
        passage.liturgical_references?.some((pRef) => pRef.id === ref.id),
      )
      .map((ref) => {
        return {
          id: ref.id,
          jad_id: ref.jad_id,
          value: ref.name,
          description: ref.description,
          date: ref.date,
        };
      });

    return {
      id: passage.id,
      jad_id: passage.jad_id,
      passage: passage.passage,
      work: workForPassage,
      position_in_work: passage.position_in_work,
      commented_bible_lvl0: bible_comm_lvl0,
      commented_bible_lvl1: bible_comm_lvl1,
      pages: passage.text_paragraph?.match(/p\. (\d+\w?)/)?.[1] || null,
      note: passage.note,
      explicit_contemp_ref: passage.explicit_contemp_ref,
      biblical_references: passage.biblical_references,
      keywords: passage.keywords.map(({ order, ...rest }) => rest),
      part_of_cluster: passage.part_of_cluster,
      liturgical_references: litRefs,
      occurrence_found_in: passage.occurrence_found_in.map(
        ({ order, ...rest }) => rest,
      ),
      text_taken_from: passage.text_taken_from.map(
        ({ order, ...rest }) => rest,
      ),
      source_passage: passage.source_passage,
      text_paragraph: normalizeText(passage.text_paragraph), // normalize whitespace
      mss_occurrences: mssSorted,
      bibl_refs: passage.biblical_references,
      biblical_ref_lvl0: lvl0,
      biblical_ref_lvl1: lvl1,
      edition_link: passage.edition_link || "",
      status: passage.status.value || "",
      bibliography: passage.bibliography || "",
      image: passage.image || "",
      prev: passage.prev,
      next: passage.next,
    };
  });

console.log("1st round passages file enriched.");

// enrich works with manuscripts data from manuscriptsPlus
// also group passages by position_in_work and sort them accordingly

const worksPlus = works
  .filter((work) => work.title) // filter out works without title
  .map((work) => {
    let processedPassages = [];
    const related_manuscripts = new Map();
    for (const ms of work.manuscripts) {
      related_manuscripts.set(ms.id, {
        id: ms.id || "",
        jad_id: `jad_manuscript__${ms.id}` || "",
        name: ms.value || "",
      });
    }
    const related__passages = passages
      .filter((p) => p.work.some((w) => w.id === work.id))
      .map((p) => {
        return {
          id: p.id,
          jad_id: p.jad_id,
          passage: p.passage,
          position_in_work: p.position_in_work || "without attribution",
          text_paragraph: p.text_paragraph,
          occurrence_found_in: p.occurrence_found_in,
        };
      });
    if (related__passages && related__passages.length > 0) {
      // First, group passages by position_in_work
      const groupedPassages = related__passages.reduce((grouped, passage) => {
        const key = passage.position_in_work || "";

        if (!grouped[key]) {
          grouped[key] = [];
        }

        // Add only selected fields from each passage
        grouped[key].push({
          id: passage.id,
          jad_id: passage.jad_id,
          passage: passage.passage,
          page: passage.text_paragraph?.match(/ p\. (\d+\w?)/)?.[1] || "",
          occurrence_found_in:
            passage.occurrence_found_in.map((occ) => occ.value) || [],
        });

        return grouped;
      }, {});

      // convert the grouped object into the array
      processedPassages = Object.entries(groupedPassages).map(
        ([position, passages]) => ({
          position_in_work: position,
          sort_position: calculateSortPosition(position),
          passages: passages,
        }),
      );
      // sort by sort_position
      processedPassages.sort((a, b) => a.sort_position - b.sort_position);
    }

    const related_passages_set = [
      ...new Set(related__passages.map((p) => p.id)),
    ];
    // get realted mss from ms_occurrences by filtering occ where there is a passage from the work
    msOccurrences
      .filter((occ) =>
        occ.occurrence.some((passage) =>
          related_passages_set.includes(passage.id),
        ),
      )
      .forEach((occ) => {
        if (!related_manuscripts.has(occ.manuscript[0]?.id)) {
          related_manuscripts.set(occ.manuscript[0].id, {
            id: occ.manuscript[0]?.id || "",
            jad_id: `jad_manuscript__${occ.manuscript[0]?.id}` || "",
            name: occ.manuscript[0]?.value || "",
          });
        }
      });
    // there are still some mss attached only to the work - baserow outdated field

    // convert map to array
    const related_mss = Array.from(related_manuscripts.values());

    const related_authors = authorsPlus.filter((aut) =>
      work.author.some((w_aut) => w_aut.id === aut.id),
    );
    let edition;
    if (
      work.published_edition[0].value === "Other edition" &&
      work.volume_edition_or_individual_editor
    ) {
      edition = work.volume_edition_or_individual_editor;
    } else if (
      work.published_edition[0].value != "Other edition" &&
      work.volume_edition_or_individual_editor
    ) {
      edition = `${work.published_edition[0].value}, ${work.volume_edition_or_individual_editor}`;
    } else if (work.published_edition[0].value) {
      edition = work.published_edition[0].value;
    }
    return {
      id: work.id,
      jad_id: work.jad_id,
      title: work.title,
      author: related_authors.map(({ prev, next, works, ...rest }) => rest),
      author_certainty: work.author_certainty,
      manuscripts: related_mss,
      genre: work.genre?.value || "",
      description: work.description,
      notes: work.notes || "",
      notes__author: work.notes__author || "",
      institutional_context:
        work.institutional_context.map(({ order, ...rest }) => rest) || [],
      published_edition:
        work.published_edition.map(({ order, ...rest }) => rest) || [],
      date: enrichDates(work.date, dates),
      date_certainty: work.date_certainty,
      link_digital_editions: work.link_digital_editions || "",
      edition: edition || "",
      other_editions: work.other_editions || "",
      related__passages: processedPassages, // Use the processed passages here
      view_label: work.view_label || "",
      next: work.next || {},
      prev: work.prev || {},
    };
  });
const worksEnriched = addPrevNextToItems(worksPlus, "jad_id", "title");

writeJson("works", works);

// enrich passages with data from worksPlus (author name, dates)
const passagesPlusWorks = passagesPlus.map((p) => {
  const related_works = worksPlus
    .filter((w) => w.id === p.work[0]?.id)
    .map((w) => {
      return {
        id: w.id,
        jad_id: w.jad_id,
        title: w.title,
        author: w.author?.map((a) => ({
          jad_id: a.jad_id,
          name: a.name,
          alt_name: a.alt_name,
          place: a.place,
          occupation: a.occupation,
        })),
        author_certainty: w.author_certainty,
        date: w.date,
        date_certainty: w.date_certainty,
        edition: w.edition,
        link_digital_editions: w.link_digital_editions,
        genre: w.genre,
      };
    });
  return {
    ...p,
    work: related_works,
  };
});
// store each passage min info in public for compare component add additional passage tool
// store in public to fetch in the compare component without having to fetch the whole passages.json
const publicPath = join(process.cwd(), "public", "data", "passages");
mkdirSync(publicPath, { recursive: true });

const passagesForCompare = passagesPlusWorks.map((p) => {
  return {
    id: p.id,
    jad_id: p.jad_id,
    work: p.work.map((w) => ({
      title: w.title,
      author: w.author?.map((a) => a.name).join(", ") || "",
    })),
    position_in_work: p.position_in_work,
    text_paragraph: p.text_paragraph,
  };
});
passagesForCompare.forEach((p) => {
  writeFileSync(
    join(publicPath, `${p.jad_id}.json`),
    JSON.stringify(p, null, 2),
    { encoding: "utf-8" },
  );
});
// minimal data for passages for the charts and graphs
const passagesForGraphs = passagesPlusWorks.map((p) => {
  const workTitle = p.work.map((w) => w.title).join(", ");
  const author = p.work[0].author?.map((a) => a.name).join(", ");
  const position = p.position_in_work;
  const title =
    position && author
      ? `${author}: ${workTitle} (${position})`
      : author
        ? `${author}: ${workTitle}`
        : workTitle;

  return {
    id: p.id,
    jad_id: p.jad_id,
    title: title,
    place: p.work[0].author[0]?.place.map((p) => p.value),
    date: p.work[0].date[0]?.value,
    century: p.work[0].date[0]?.century,
    genre: p.work[0].genre,
    passage: p.passage,
    liturgical_references: p.liturgical_references.map((ref) => ref.value),
    keywords: p.keywords.map((k) => k.value),
    biblical_ref_lvl0: p.biblical_ref_lvl0,
  };
});

writeJson("passagesForGraphs", passagesForGraphs);

// enrich passages with data from passagesPlus and worksPlus for the source_passages
const passagesPlusPlus = passagesPlusWorks.map((p) => {
  const source_passages = p.source_passage.map((sp) => {
    // Find the matching passage and return the enriched object
    const matchingPassage = passagesPlusWorks.find((pass) => pass.id === sp.id);

    if (matchingPassage) {
      return {
        id: matchingPassage.id,
        jad_id: matchingPassage.jad_id,
        title: matchingPassage.work[0]?.title || "Not found",
        author: matchingPassage.work[0]?.author?.[0]?.name || "",
        author_certainty: matchingPassage.work[0]?.author_certainty || "",
        passage: matchingPassage.passage,
      };
    }

    // Return original if no match found
    return sp;
  });

  return {
    ...p,
    source_passage: source_passages,
  };
});
// use imported function to build the transmission graph
const graph = buildTransmissionGraph(passagesPlusPlus);

// attach graph to each passage
const enrichedPassages = passagesPlusPlus.map((p) => ({
  ...p,
  transmission_graph: graph[p.id],
}));

// store graphData for graph load
const graphData = { nodes: [], links: [] };

// --- build nodes and links ---
enrichedPassages.forEach((passage) => {
  const nodes = passage.transmission_graph?.graph?.nodes ?? [];
  const links = passage.transmission_graph?.graph?.links ?? [];

  const datedNodes = nodes.filter((n) => n.dateNotBefore || n.dateNotAfter);

  const nodeById = new Map(datedNodes.map((n) => [n.id, n]));

  datedNodes.forEach((node) => {
    if (!graphData.nodes.some((n) => n.id === node.id)) {
      graphData.nodes.push({
        ...node,
        jad_id: node.jad_id,
      });
    }
  });

  links
    .filter((l) => nodeById.has(l.source) && nodeById.has(l.target))
    .forEach((link) => {
      if (
        !graphData.links.some(
          (l) => l.source === link.source && l.target === link.target,
        )
      ) {
        graphData.links.push({
          source: `jad_occurrence__${link.source}`,
          target: `jad_occurrence__${link.target}`,
        });
      }
    });
});

writeJson("passage-graph", graphData);

// add passages to biblical references
const biblicalRefWithPassages = Object.values(biblicalRefSorted).map((ref) => {
  const related__passages = enrichedPassages
    .filter((p) => p.biblical_references.some((b_ref) => b_ref.id === ref.id))
    .map((p) => ({
      id: p.id,
      jad_id: p.jad_id,
      passage: p.passage,
      position_in_work: p.position_in_work,
      work: p.work.map((w) => ({
        id: w.id,
        jad_id: w.jad_id,
        title: w.title,
        genre: w.genre,
        author: w.author.map((a) => ({
          jad_id: a.jad_id,
          name: a.name,
          alt_name: a.alt_name,
        })),
        author_certainty: w.author_certainty,
      })),
    }));

  return {
    ...ref,
    related_passages: related__passages,
  };
});

//process biblical references to add prev and next

const biblicalRefPlusFinal = addPrevNextToItems(
  biblicalRefWithPassages,
  "jad_id",
  "value",
);
writeJson("biblical_references", biblicalRefPlusFinal);

// enrich manuscripts with data from passagesPlus and worksPlus
const manuscriptPlusPlus = manuscriptsPlus.map((ms) => {
  const related_works = worksPlus
    .filter((w) => {
      return w.manuscripts.some((m) => m.id === ms.id);
    })
    .map((w) => ({
      id: w.id,
      title: w.title,
      jad_id: w.jad_id,
      author: {
        jad_id: w.author[0]?.jad_id || "",
        name: w.author[0]?.name || "",
      },
      author_certainty: w.author_certainty,
      genre: w.genre,
    }));
  const related_occurrences = msOccurrences
    .filter((occur) => occur.manuscript.length > 0)
    .filter((occur) => occur.manuscript[0].id === ms.id)
    .map((occurr) => {
      const passage = enrichedPassages
        .filter((p) => p.id === occurr.occurrence[0]?.id)
        .map((p) => {
          return {
            id: p.id,
            jad_id: p.jad_id,
            passage: p.passage,
            work: p.work.map((w) => ({
              id: w.id,
              jad_id: w.jad_id,
              title: w.title,
              author: w.author,
              author_certainty: w.author_certainty,
            })),
          };
        });
      return {
        position_in_ms: occurr.position_in_ms,
        main_ms: occurr.main_ms,
        facsimile_position: occurr.facsimile_position,
        passage: passage,
      };
    });
  return {
    ...ms,
    related_passages: related_occurrences,
    related_works: related_works,
  };
});

// add prev and next to passages.json
const mssPlusFinal = addPrevNextToItems(
  manuscriptPlusPlus,
  "jad_id",
  "name[0].value",
);

writeJson("manuscripts", mssPlusFinal);

const keywords = Object.values(loadJSON("keywords.json"));
const keywordsPlus = keywords
  .filter((kw) => kw.name)
  .map((kw) => {
    return {
      id: kw.id,
      jad_id: kw.jad_id,
      name: kw.name,
      description: kw.short_description || "",
      notes: kw.notes || "",
      passages: enrichedPassages
        .filter((p) => p.keywords.some((k) => k.id === kw.id))
        .map((p) => {
          return {
            id: p.id,
            jad_id: p.jad_id,
            passage: p.passage,
            work: {
              id: p.work[0]?.id || "",
              title: p.work[0]?.title || "",
              jad_id: p.work[0]?.jad_id || "",
            },
            position_in_work: p.position_in_work,
            author: p.work[0]?.author?.[0]?.name || "",
            author_certainty: p.work[0]?.author_certainty,
          };
        }),
      part_of: kw.part_of.value || "",
    };
  });
const keywordsPlusFinal = addPrevNextToItems(keywordsPlus, "jad_id", "name");

writeJson("keywords", keywordsPlusFinal);

const liturgicalRefClean = liturgical_references
  .filter((ref) => ref.name)
  .map((ref) => {
    const related_passages = passagesPlusWorks
      .filter((p) =>
        p.liturgical_references.some((p_ref) => p_ref.id === ref.id),
      )
      .map((p) => {
        return {
          id: p.id,
          jad_id: p.jad_id,
          label: p.passage,
          work: p.work[0]?.title,
          author: p.work[0]?.author[0]?.name || "",
          author_certainty: p.work[0]?.author_certainty,
          position_in_work: p.position_in_work,
        };
      });

    return {
      id: ref.id,
      jad_id: ref.jad_id,
      name: ref.name,
      description: ref.description,
      related_passages: related_passages,
    };
  });

const liturgicalPlusFinal = addPrevNextToItems(
  liturgicalRefClean,
  "jad_id",
  "name",
);

writeJson("liturgical_references", liturgicalPlusFinal);

const clustersClean = clusters
  .filter((cluster) => cluster.name)
  .map((cluster) => {
    return {
      id: cluster.id,
      jad_id: cluster.jad_id,
      name: cluster.name,
      description: cluster.description || "",
    };
  });
const clustersPlus = clustersClean.map((cluster) => {
  const related_passages = passagesPlusWorks
    .filter((p) => p.part_of_cluster.some((c) => c.id === cluster.id))
    .map((p) => {
      return {
        id: p.id,
        jad_id: p.jad_id,
        label: p.passage,
        work: p.work[0].title,
        author: p.work[0]?.author?.[0]?.name || "",
        author_certainty: p.work[0]?.author_certainty,
        position_in_work: p.position_in_work,
      };
    });
  return {
    ...cluster,
    related_passages: related_passages,
  };
});

const clustersPlusFinal = addPrevNextToItems(clustersPlus, "jad_id", "name");

writeJson("clusters", clustersPlusFinal);

const PassagesLiturgicalEnriched = enrichedPassages.map((p) => {
  const keywordsMap = new Map();
  keywordsPlusFinal
    .filter((kw) => p.keywords.some((p_kw) => p_kw.id === kw.id))
    .forEach((kw) => {
      const hasParent = kw.part_of;
      const parent = hasParent ? kw.part_of : "N/A";
      if (!keywordsMap.has(parent)) {
        keywordsMap.set(parent, {
          label: parent,
          subkeywords: [],
        });
      }

      if (parent) {
        keywordsMap.get(parent).subkeywords.push({
          label: kw.name,
          description: kw.description,
          jad_id: kw.jad_id,
        });
      }
    });
  const related_keywords = Array.from(keywordsMap.values());

  return {
    ...p,
    keywords: related_keywords,
  };
});
// add prev and next to passages.json

const PassagesClusterEnriched = PassagesLiturgicalEnriched.map((p) => {
  const related_clusters = clusters
    .filter((cluster) =>
      p.part_of_cluster.some((p_cluster) => p_cluster.id === cluster.id),
    )
    .map((cluster) => ({
      jad_id: cluster.jad_id,
      value: cluster.name,
      description: cluster.description,
    }));
  return {
    ...p,
    part_of_cluster: related_clusters,
  };
});
const passagesPlusFinal = addPrevNextToItems(
  //remove bibl_refs
  PassagesClusterEnriched,
  "jad_id",
  "name",
).map(({ bibl_refs, ...rest }) => rest);

writeJson("passages", passagesPlusFinal);

const passageList = new Map();
passagesPlusFinal.forEach((p) => {
  const title = p.work[0]?.title || "";
  const author = p.work[0]?.author?.[0]?.name || "";
  const position_in_work = p.position_in_work;
  passageList.set(p.jad_id, {
    id: p.id,
    full_title:
      author && position_in_work
        ? `${author}: ${title} (${position_in_work})`
        : author
          ? `${author}: ${title}`
          : title,
  });
});
const passageListObject = Object.fromEntries(passageList);

writeJson("passage_list", passageListObject);
// slim version of passages for the biblical commentaries table (biblical-commentaries.svelte)
// need passage jad_id (for link), work title + author, bible_comm

const passagesForBiblComm = passagesPlusFinal
  .filter((p) => p.commented_bible_lvl0.length) //take only passages from bib commentaries
  .map((p) => {
    const workAut = p.work[0].author
      ? `${p.work[0].author.map((a) => a.name).join(", ")}, ${p.work[0].title}`
      : p.work[0].title;
    return {
      jad_id: p.jad_id,
      workTitle: workAut,
      bible_comm_lvl0: p.commented_bible_lvl0[0] || "",
      bible_comm_lvl1: p.commented_bible_lvl1[0]?.split("|")[1] || "",
    };
  });
writeJson("passagesForBiblComm", passagesForBiblComm);

// slim version of passages for the biblical refs graph (biblical-refs.svelte)
// need passage jad_id (for link), work title + author, bible_refs, date

const passagesForBiblRefs = passagesPlusWorks
  .filter((p) => p.biblical_references.length && p.work[0].date.length)
  .map((p) => {
    const workAut = p.work[0].author
      ? `${p.work[0].author.map((a) => a.name).join(", ")}, ${p.work[0].title}`
      : p.work[0].title;
    const date = p.work[0].date.map((d) => {
      return {
        notBefore: d.not_before,
        notAfter: d.not_after,
      };
    });
    return {
      jad_id: p.jad_id,
      workTitle: workAut,
      date: date,
      biblRefs: p.bibl_refs.map((ref) => ref.value),
    };
  });
writeJson("passagesForBiblRefs", passagesForBiblRefs);
