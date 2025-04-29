import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { enrichDates } from "./utils.js";
import { buildTransmissionGraph } from "./build-transmission-graph.js";

const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "src/content/data", file), "utf8")
  );

const passages = Object.values(loadJSON("passages.json"));
const dates = Object.values(loadJSON("dates.json"));
const aiBiblRef = loadJSON("ai_bibl_ref.json");

// set the output folder
const folderPath = join(process.cwd(), "src", "content", "data");
mkdirSync(folderPath, { recursive: true });

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

const passagesPlus = passages.map((passage) => {
  const lvl0 = [];
  const lvl1 = [];
  const lvl2 = [];

  if (passage.biblical_references && passage.biblical_references.length > 0) {
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
      lvl1.push(`${book} > ${chapterTrimmed}`);
      lvl2.push(`${book} > ${chapterTrimmed} > ${verseTrimmed}`);
    });
  }
  // enrich the date from dates.json using helper function
  if (passage.work.some((w) => w.date.length > 0)) {
    passage.work = passage.work.map((w) => ({
      ...w,
      date: enrichDates(w.date, dates),
    }));
  }

  // add aiBiblicalRef to each passage
  const aiBiblicalRefEntry = aiBiblRef[passage.jad_id];

  return {
    ...passage,
    biblical_ref_lvl0: lvl0,
    biblical_ref_lvl1: lvl1,
    biblical_ref_lvl2: lvl2,
    ai_bibl_ref: aiBiblicalRefEntry || [],
  };
});

// use imported function to build the transmission graph
const graph = buildTransmissionGraph(passagesPlus);

// attach graph to each passage
const enrichedPassages = passagesPlus.map((p) => ({
  ...p,
  transmission_graph: graph[p.id],
}));

writeFileSync(
  join(folderPath, "passages.json"),
  JSON.stringify(enrichedPassages, null, 2),
  { encoding: "utf-8" }
);

console.log(
  "passages.json file updated successfully with biblical ref in hierarchical structure."
);
