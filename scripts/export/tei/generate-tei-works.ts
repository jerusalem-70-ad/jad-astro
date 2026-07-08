import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { WorkFull } from "@/types";
import main from "./main-tei-work";
import { log } from "@acdh-oeaw/lib";

const outputDir = join(process.cwd(), "public", "download", "tei", "works");

const donwloadDir = join(process.cwd(), "public", "download");

mkdirSync(outputDir, { recursive: true });
mkdirSync(donwloadDir, { recursive: true });
function writeXMLFile(filename: string, content: string) {
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, content, "utf8");
  log.success(`Generated: ${filename} ${filepath}`);
}

function generateWorksXML() {
  const works: WorkFull[] = JSON.parse(
    readFileSync("src/content/data/works.json", "utf-8"),
  );

  for (const work of works) {
    const xml = main(work);
    writeXMLFile(`${work.jad_id}.xml`, xml);
  }
  log.success(works.length, " TEI-XML and JSON generated");
}
generateWorksXML();
