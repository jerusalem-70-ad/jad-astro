import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  enrichDates,
  normalizeText,
  enrichPlaces,
  enrichLibraries,
  addPrevNextToItems,
} from "./utils.js";
import { buildTransmissionGraph } from "./build-transmission-graph.js";
import {
  generateBiblicalSortKey,
  calculateSortPosition,
} from "./sort-bibl-ref.js";
import { createNetworkData } from "./create-network-data.js";

const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "src/content/row", file), "utf8")
  );

const passages = Object.values(loadJSON("occurrences.json"));
const dates = Object.values(loadJSON("date.json"));
const biblicalRef = Object.values(loadJSON("biblical_references.json"));
const manuscripts = Object.values(loadJSON("manuscripts.json"));
const msOccurrences = Object.values(loadJSON("ms_occurrences.json"));
const works = Object.values(loadJSON("works.json"));
const authors = Object.values(loadJSON("authors.json"));
const places = Object.values(loadJSON("places.json"));
const institutional_context = Object.values(
  loadJSON("institutional_context.json")
);
const liturgical_references = Object.values(
  loadJSON("liturgical_references.json")
);
const libraries = Object.values(loadJSON("libraries.json"));

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "data");
mkdirSync(folderPath, { recursive: true });

// enrich places with geonames_url, jad_id, lat, long from places.json
// used in authors.json and manuscripts.json

// create map for authros to use in instant search to match the search normalized field and use the normal name for display

const authorMapObject = {};
authors.forEach((aut) => {
  const normalizedKey = aut.name.toLowerCase().replace(/-/g, " ");
  authorMapObject[normalizedKey] = aut.name;
});
// enrich authors with places and transform dates
const authorsPlus = authors
  .filter((aut) => aut.name) // filter out authors without a name
  .map((aut) => {
    const raw_dates = [
      {
        not_before: aut.date_of_birth || "",
        not_after: aut.date_of_death || "",
        range:
          aut.date_of_birth || aut.date_of_death
            ? `${aut.date_of_birth || ""}-${aut.date_of_death || ""}`
            : "",
      },
    ];
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
      date_of_birth: aut.date_of_birth || "",
      date_of_death: aut.date_of_death || "",
      origDates: raw_dates,
      place: enrichPlaces(aut.place, places),
      alt_name: aut.alt_name?.replace(",", "") || "",
      notes: aut.notes || "",
      gnd_url: aut.gnd_url || "",
      works: related_works,
    };
  });

const updatedauthors = addPrevNextToItems(authorsPlus, "jad_id", "name");

writeFileSync(
  join(folderPath, "authors.json"),
  JSON.stringify(updatedauthors, null, 2),
  { encoding: "utf-8" }
);

console.log("authors.json file enriched successfully.");

// Write as JSON file
writeFileSync(
  join(folderPath, "authors_map.json"),
  JSON.stringify(authorMapObject, null, 2)
);

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

// Write the enhanced biblical references back to file
writeFileSync(
  join(folderPath, "biblical_references.json"),
  JSON.stringify(biblicalRefSorted, null, 2)
);
console.log("Biblical references enriched and written successfully.");

//rewrite passages
// mapping abbreviations with book names
const bookMap = {
  // Pentateuch (Moses' books)
  Gen: "Genesis",
  Ex: "Exodus",
  Lev: "Leviticus",
  Num: "Numbers",
  Deut: "Deuteronomy",

  // Historical books (Latin tradition)
  Ios: "Joshua",
  Iud: "Judges",
  Ruth: "Ruth",
  "1 Reg": "1 Kings", // In Latin/Vulgate, Regum = Kings
  "2 Reg": "2 Kings",
  "3 Reg": "3 Kings", // aka 1 Kings (English)
  "4 Reg": "4 Kings", // aka 2 Kings (English)
  "1 Par": "1 Chronicles", // Paralipomenon
  "2 Par": "2 Chronicles",
  Esdr: "Ezra",
  Ne: "Nehemiah",
  Tob: "Tobit",
  Iudith: "Judith",
  Est: "Esther",
  "1 Macc": "1 Maccabees",
  "2 Macc": "2 Maccabees",

  // Wisdom and poetry books
  Iob: "Job",
  Ps: "Psalms",
  Prov: "Proverbs",
  Koh: "Ecclesiastes", // Also "Ecc" = Qoheleth
  Cant: "Song of Songs",
  Sap: "Wisdom",
  Sir: "Sirach",

  // Major prophets
  Is: "Isaiah",
  Jer: "Jeremiah",
  Lam: "Lamentations",
  Bar: "Baruch",
  Ez: "Ezekiel",
  Dan: "Daniel",

  // Minor prophets
  Os: "Hosea",
  Ioel: "Joel",
  Amos: "Amos",
  Abd: "Obadiah",
  Ion: "Jonah",
  Mich: "Micah",
  Nah: "Nahum",
  Hab: "Habakkuk",
  Soph: "Zephaniah",
  Agg: "Haggai",
  Zach: "Zechariah",
  Mal: "Malachi",

  // Gospels
  Mt: "Matthew",
  Mk: "Mark",
  Lk: "Luke",
  Joh: "John",

  // Acts and Pauline epistles
  Acts: "Acts",
  Rom: "Romans",
  "1 Cor": "1 Corinthians",
  "2 Cor": "2 Corinthians",
  Gal: "Galatians",
  Eph: "Ephesians",
  Phil: "Philippians",
  Col: "Colossians",
  "1 Thes": "1 Thessalonians",
  "2 Thes": "2 Thessalonians",
  "1 Tim": "1 Timothy",
  "2 Tim": "2 Timothy",
  Tit: "Titus",
  Phlm: "Philemon",
  Hebr: "Hebrews",

  // Catholic epistles
  Iac: "James",
  "1 Pet": "1 Peter",
  "2 Pet": "2 Peter",
  "1 Joh": "1 John",
  "2 Joh": "2 John",
  "3 Joh": "3 John",
  Iud: "Jude",

  // Apocalypse
  Rev: "Revelation",
};

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
        ({ order, ...rest }) => rest
      ),
      format: ms.format,
      date_written: enrichDates(ms.date_written, dates),
    };
  });

const passagesPlus = passages
  .filter((passage) => passage.passage) // filter out empty passages
  .map((passage) => {
    // hierarchical 3-level index for the typesense schema for biblical references
    // level 0 for book (using the bookMap above), lv 1 for chapter, and lv 2 for verse
    const lvl0 = [];
    const lvl1 = [];
    const lvl2 = [];

    if (
      passage.biblical_references &&
      passage.biblical_references.length > 0 &&
      passage.biblical_references[0].value
    ) {
      passage.biblical_references.forEach((ref) => {
        let bookAbbrev, chapterVerse;
        const specialCases = ["Joel", "Acts", "Job", "Osee", "Amos", "Ruth"];
        if (specialCases.includes(ref.value.split(/[\s.,]/)[0])) {
          bookAbbrev = ref.value.split(/[\s.,]/)[0];
          chapterVerse = ref.value.substring(bookAbbrev.length).trim();
        } else {
          [bookAbbrev, chapterVerse] = ref.value.split(".");
        }
        const book = bookMap[bookAbbrev.trim()] || bookAbbrev;

        let chapter, verse;
        if (chapterVerse?.includes(",")) {
          [chapter, verse] = chapterVerse.split(",");
        } else {
          chapter = chapterVerse;
          verse = "";
        }

        // Trim any accidental spaces
        const chapterTrimmed = chapter?.trim();
        const verseTrimmed = verse?.trim();

        lvl0.push(book);
        lvl1.push(`${book} > ${book} ${chapterTrimmed}`);
        lvl2.push(`${book} > ${chapterTrimmed} > ${verseTrimmed}`);
      });
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
          item.occurrence.length > 0 && item.occurrence[0].id === passage.id
      )
      .map((item) => {
        const mss = manuscriptsPlus
          .filter((ms) => item.manuscript.some((man) => man.id === ms.id))
          // map them to get only the necessary fields
          .map((ms) => {
            return {
              id: ms.id,
              name: `${ms.library[0].place[0]?.value}, ${ms.name[0].value}`,
              jad_id: ms.jad_id,
            };
          });
        return {
          manuscript: mss.map((ms) => ms.name).join(", ") || "TBD",
          manuscript_jad_id: mss.map((ms) => ms.jad_id).join(", "),
          position_in_ms: item.position_in_ms,
          main_ms: item.main_ms,
          facsimile_position: item.facsimile_position,
          ms_locus: item.ms_locus[0]?.value || "",
        };
      });

    //enrich biblical_references with sort key using the biblicalRefSorted
    if (passage.biblical_references && passage.biblical_references.length > 0) {
      passage.biblical_references = passage.biblical_references.map((ref) => {
        // Find the enriched reference by id (as string, since biblicalRefSorted keys are likely strings)
        const enriched = biblicalRefSorted[String(ref.id)];
        return {
          ...(enriched || {}), // Merge in all properties from biblicalRefSorted if found
        };
      });
    }

    // enrich source_passage with title and author from works.json
    if (passage.source_passage && passage.source_passage.length > 0) {
      passage.source_passage = passage.source_passage.map((source) => {
        const p = passages.find((p) => p.id === source.id);
        return {
          id: p.id,
          jad_id: p.jad_id,
          title: p.work[0]?.title || "",
          author: p.work[0]?.author?.[0]?.name || "",
          position_in_work: p.position_in_work,
          passage: p.passage,
        };
      });
    }

    return {
      id: passage.id,
      jad_id: passage.jad_id,
      passage: passage.passage,
      work: passage.work,
      position_in_work: passage.position_in_work,
      pages: passage.text_paragraph?.match(/p\. (\d+\w?)/)?.[1] || null,
      note: passage.note,
      explicit_contemp_ref: passage.explicit_contemp_ref,
      biblical_references: passage.biblical_references,
      keywords: passage.keywords,
      part_of_cluster: passage.part_of_cluster,
      liturgical_references: passage.liturgical_references,
      occurrence_found_in: passage.occurrence_found_in.map(
        ({ order, ...rest }) => rest
      ),
      source_passage: passage.source_passage,
      incipit: passage.incipit,
      prev: passage.prev,
      next: passage.next,
      text_paragraph: normalizeText(passage.text_paragraph),
      mss_occurrences: msOccurrence,
      biblical_ref_lvl0: lvl0,
      biblical_ref_lvl1: lvl1,
      biblical_ref_lvl2: lvl2,
      edition_link: passage.edition_link || "",
    };
  });

console.log("passages.json file enriched successfully.");

// enrich works with manuscripts data from manuscriptsPlus
// also group passages by position_in_work and sort them accordingly

const worksPlus = works
  .filter((work) => work.title) // filter out works without title
  .map((work) => {
    let processedPassages = [];
    const related__passages = passages
      .filter((p) => p.work.some((w) => w.id === work.id))
      .map((p) => {
        return {
          id: p.id,
          jad_id: p.jad_id,
          passage: p.passage,
          position_in_work: p.position_in_work,
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

        // Add only the fields you want from each passage
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

      // Then convert the grouped object into the array format you want
      processedPassages = Object.entries(groupedPassages).map(
        ([position, passages]) => ({
          position_in_work: position,
          sort_position: calculateSortPosition(position),
          passages: passages,
        })
      );
      // Sort the processedPassages array by sort_position
      processedPassages.sort((a, b) => a.sort_position - b.sort_position);
    }

    const related_authors = authorsPlus.filter((aut) =>
      work.author.some((w_aut) => w_aut.id === aut.id)
    );
    return {
      id: work.id,
      jad_id: work.jad_id,
      title: work.title,
      author: related_authors,
      author_certainty: work.author_certainty,
      manuscripts: manuscriptsPlus
        .filter((ms) => work.manuscripts.some((w_ms) => w_ms.id === ms.id))
        .map((ms) => ({
          id: ms.id,
          jad_id: ms.jad_id,
          name: `${ms.library[0].place[0]?.value}, ${ms.name[0].value}`,
        })),
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
      incipit: work.incipit || "",
      volume_edition_or_individual_editor:
        work.volume_edition_or_individual_editor || "",
      other_editions: work.other_editions || "",
      related__passages: processedPassages, // Use the processed passages here
      view_label: work.view_label || "",
      next: work.next || {},
      prev: work.prev || {},
    };
  });

writeFileSync(
  join(folderPath, "works.json"),
  JSON.stringify(worksPlus, null, 2),
  { encoding: "utf-8" }
);

console.log("works.json file enriched successfully.");

// use imported function to build the transmission graph
//const graph = buildTransmissionGraph(passagesPlus);

// attach graph to each passage
/* const enrichedPassages = passagesPlus.map((p) => ({
  ...p,
  transmission_graph: graph[p.id],
})); */

const passagesPlusFinal = passagesPlus.map((p) => {
  const related_works = worksPlus.filter((w) => w.id === p.work[0]?.id);
  return {
    ...p,
    work: related_works,
    //transmission_graph: graph[p.id],
  };
});

writeFileSync(
  join(folderPath, "passages.json"),
  JSON.stringify(passagesPlusFinal, null, 2),
  { encoding: "utf-8" }
);

// enrich manuscripts with data from passagesPlus and worksPlus
const manuscriptPlusPlus = manuscriptsPlus.map((ms) => {
  const related_occurrences = msOccurrences
    .filter((occur) => occur.manuscript.length > 0)
    .filter((occur) => occur.manuscript[0].id === ms.id)
    .map((occurr) => {
      const passage = passagesPlus.find(
        (p) => p.id === occurr.occurrence[0].id
      );
      return {
        passages: passage,
        position_in_ms: occurr.position_in_ms,
        main_ms: occurr.main_ms,
        facsimile_position: occurr.facsimile_position,
      };
    });
  return {
    ...ms,
    related_occurrences: related_occurrences,
  };
});

writeFileSync(
  join(folderPath, "manuscripts.json"),
  JSON.stringify(manuscriptPlusPlus, null, 2),
  { encoding: "utf-8" }
);

console.log("passages.json file enriched successfully.");

/* console.log("Generating network data...");
const networkData = createNetworkData(enrichedPassages);

// Save the network data
writeFileSync(
  join(folderPath, "network_data.json"),
  JSON.stringify(networkData, null, 2),
  { encoding: "utf-8" }
);

console.log("Network data generated successfully."); */
