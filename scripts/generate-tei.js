import { Eta } from "eta";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, readFile } from "fs";
import { enrichDates } from "./utils.js";

// Function to load JSON files from the data directory
const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "src/content/data", file), "utf8")
  );

const manuscripts = Object.values(loadJSON("manuscripts.json"));
const passages = loadJSON("passages.json");
const dates = Object.values(loadJSON("dates.json"));
const works = loadJSON("works.json");
const keywords = Object.values(loadJSON("keywords.json"));
const clusters = Object.values(loadJSON("clusters.json"));
const liturgical_references = Object.values(
  loadJSON("liturgical_references.json")
);

// create a lookup map for passages by work.jad_id
const passagesByWorkId = new Map();
passages.forEach((passage) => {
  if (!passage.work || passage.work.length === 0) return; // Skip if work array is empty
  const workJadId = passage.work[0].jad_id;
  if (!passagesByWorkId.has(workJadId)) {
    passagesByWorkId.set(workJadId, []);
  }
  passagesByWorkId.get(workJadId).push(passage);
});
console.log(passagesByWorkId.size, "works with passages found.");

// Create a lookup map for manuscripts by id or jad_id
const manuscriptById = new Map();
manuscripts.forEach((ms) => {
  // Enrich dates if they are arrays
  if (Array.isArray(ms.date_written)) {
    ms.date_written = enrichDates(ms.date_written, dates);
  }
  manuscriptById.set(ms.id, ms);
  if (ms.jad_id) manuscriptById.set(ms.jad_id, ms);
});

// set the output folder
const worksFolderPath = join(process.cwd(), "public", "tei", "works");
mkdirSync(worksFolderPath, { recursive: true });

// Eta views path
const eta = new Eta({ views: join(process.cwd(), "tei-templates") });

// Enrich each work with full manuscript info
works.forEach((work) => {
  if (work.manuscripts.length > 0) {
    work.full_manuscripts = work.manuscripts
      .map((ref) => manuscriptById.get(ref.id))
      .filter(Boolean); // Remove nulls if manuscript wasn't found
  }
  // get passages from this work
  work.passages = passagesByWorkId.get(work.jad_id) || [];

  // create array with keywords, clusters, and liturgical references for taxonomies
  work.taxonomy_keywords = keywords;
  work.taxonomy_clusters = clusters;
  work.taxonomy_liturgical_references = liturgical_references;

  // Render the template with data
  const xml = eta.render("./work.eta", work);

  // Use hit_id as unique identifier for the filename
  const filename = work.jad_id ? `${work.jad_id}.xml` : `work_${work.id}.xml`;

  // Write the XML file
  writeFileSync(join(worksFolderPath, filename), xml);
});
console.log(`Generated TEI for ${works.length} works.`);
