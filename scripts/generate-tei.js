import { Eta } from "eta";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, readFile } from "fs";

// Get project root (one level up from current file)
const projectRoot = new URL("..", import.meta.url).pathname;

// read the source json file
const works = JSON.parse(
  readFileSync(
    join(projectRoot, "src", "content", "data", "works.json"),
    "utf-8"
  )
);
// set the output folder
const worksFolderPath = join(process.cwd(), "public", "tei", "works");
mkdirSync(worksFolderPath, { recursive: true });

// Eta views path
const eta = new Eta({ views: join(process.cwd(), "tei-templates") });

works.forEach((work) => {
  // Render the template with data
  const xml = eta.render("./work.eta", work);

  // Use hit_id as unique identifier for the filename
  const filename = work.jad_id ? `${work.jad_id}.xml` : `work_${work.id}.xml`;

  // Write the XML file
  writeFileSync(join(worksFolderPath, filename), xml);
});
console.log(`Generated TEI for ${works.length} works.`);
