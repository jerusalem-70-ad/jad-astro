import { join } from "path";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  copyFileSync,
} from "fs";
import { SyntaxValidator } from "fast-xml-validator";
import type { Passage } from "@/types";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { log } from "@acdh-oeaw/lib";

const projectData = {
  project_title: "Medieval Reception of the Roman Conquest of Jerusalem",
  base_url: "https://jerusalem-70-ad.github.io/jad-astro",
  download_url:
    "https://jerusalem-70-ad.github.io/jad-astro/download/tei/passages",
};

const currentDateTime = new Date().toISOString();
const currentDate = currentDateTime.split("T")[0];
// Helper to format and validate XML
function formatXML(xmlString: string) {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const doc = parser.parseFromString(xmlString, "application/xml");
  return serializer.serializeToString(doc);
}

function validateXML(xmlContent: string, filename: string) {
  const result = SyntaxValidator.validate(xmlContent, {
    allowBooleanAttributes: true,
  });

  if (result !== true) {
    log.error(`XML validation failed for ${filename}:`, result.err);
    return false;
  }
  return true;
}

interface ObjectListItem {
  id: string;
  title: string;
}

async function main() {
  log.info("Generating OAI-PMH files for passages...\n");

  // Create output folder
  const oaiFolder = join(process.cwd(), "public", "oai-pmh");
  rmSync(oaiFolder, { recursive: true, force: true });
  mkdirSync(oaiFolder, { recursive: true });

  // Load passages data
  const data = JSON.parse(
    readFileSync(
      join(process.cwd(), "src/content/data/passages.json"),
      "utf-8",
    ),
  );

  // Build object list for passages
  const objectList = data.map((passage: Passage) => ({
    id: `${passage.jad_id}.xml`,
    title: escapeXml(passage.passage) || "Untitled Passage",
  }));

  log.info(`Processing ${objectList.length} items...\n`);

  // 1. Generate Identify.xml
  log.info("Generating Identify.xml...");
  const identifyXml = identifyXML();

  writeFileSync(
    join(oaiFolder, "Identify.xml"),
    formatXML(identifyXml),
    "utf-8",
  );

  const identifyPath = join(oaiFolder, "Identify.xml");
  writeFileSync(identifyPath, formatXML(identifyXml), "utf-8");

  if (validateXML(identifyXml, "Identify.xml")) {
    log.success("Identify.xml created\n");
  }

  // 3. Generate ListIdentifiers.xml
  log.info("Generating ListIdentifiers.xml...");
  const listIdentifiersXml = listIdentifiersXML(objectList);

  const listIdentifiersPath = join(oaiFolder, "ListIdentifiers.xml");
  writeFileSync(listIdentifiersPath, formatXML(listIdentifiersXml), "utf-8");

  if (validateXML(listIdentifiersXml, "ListIdentifiers.xml")) {
    log.success("ListIdentifiers.xml created\n");
  }
  // 2. Generate ListRecords.xml
  log.info("Generating ListRecords.xml...");
  const listRecordsXml = listRecords(objectList);

  const listRecordsPath = join(oaiFolder, "ListRecords.xml");
  writeFileSync(listRecordsPath, formatXML(listRecordsXml), "utf-8");

  if (validateXML(listRecordsXml, "ListRecords.xml")) {
    log.success("ListRecords.xml created\n");
  }

  // 4. Generate ListMetadataFormats.xml (optional but good to have)
  log.info("Generating ListMetadataFormats.xml...");
  const listMetadataXml = listMetadataFormats();

  const listMetadataPath = join(oaiFolder, "ListMetadataFormats.xml");
  writeFileSync(listMetadataPath, formatXML(listMetadataXml), "utf-8");

  if (validateXML(listMetadataXml, "ListMetadataFormats.xml")) {
    log.success("ListMetadataFormats.xml created\n");
  }

  // 5. Copy index.html (if it exists)
  log.info("Copying index.html...");
  const indexSource = join(process.cwd(), "oai-pmh", "index.html");
  const indexDest = join(oaiFolder, "index.html");

  try {
    copyFileSync(indexSource, indexDest);
    log.success("index.html copied\n");
  } catch (error) {
    log.warn("Warning: Could not copy index.html (file may not exist)");
    log.warn(`Expected location: ${indexSource}\n`);
    // Optionally create a basic index.html
    const basicIndex = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>OAI-PMH</title>
  </head>
  <body>
    <main>
        <h1>Static OAI-PMH for ${projectData.project_title}</h1>
        <h2>Endpoints</h2>
        <ul>
            <li><a href="Identify.xml">Identify</a></li>
            <li><a href="ListMetadataFormats.xml">ListMetadataFormats</a></li>
            <li><a href="ListIdentifiers.xml">ListIdentifiers</a></li>
            <li><a href="ListRecords.xml">ListRecords</a></li>
        </ul>
    </main>
  </body>
</html>`;

    writeFileSync(indexDest, basicIndex, "utf-8");
    log.success("Generated basic index.html\n");
  }

  console.log("═══════════════════════════════════════");
  console.log("OAI-PMH generation complete!");
  console.log(`Total passages indexed: ${objectList.length}`);
  console.log(`Output folder: ${oaiFolder}`);
  console.log("═══════════════════════════════════════");
}

main().catch((error) => {
  log.error("Fatal error:", error.message);
  process.exit(1);
});

function identifyXML() {
  return `<?xml version="1.0" encoding="UTF-8"?>
        <OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/
                http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
          <responseDate>${currentDateTime}</responseDate>
          <request verb="Identify">${projectData.base_url}</request>
          <Identify>
            <repositoryName>${projectData.project_title}</repositoryName>
            <baseURL>${projectData.base_url}</baseURL>
            <protocolVersion>2.0</protocolVersion>
            <adminEmail>acdh-tech@oeaw.ac.at</adminEmail>
            <earliestDatestamp>${currentDateTime}</earliestDatestamp>
            <deletedRecord>no</deletedRecord>
            <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
          </Identify>
        </OAI-PMH>`;
}

function listIdentifiersXML(objectList: ObjectListItem[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
      <OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/">
        <responseDate>${currentDateTime}</responseDate>
        <ListIdentifiers>
      ${objectList
        .map(
          (item) => `
          <header>
            <identifier>${item.id}</identifier>
            <datestamp>${currentDate}</datestamp>
          </header>`,
        )
        .join("\n")}
        </ListIdentifiers>
      </OAI-PMH>`;
}

function listMetadataFormats() {
  return `<?xml version="1.0" encoding="UTF-8"?>
      <OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/
              http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
            <responseDate>${currentDateTime}</responseDate>
          <request verb="ListMetadataFormats">${projectData.base_url}/oai-pmh</request>
          <ListMetadataFormats>
              <metadataFormat>
                  <metadataPrefix>oai_dc</metadataPrefix>
                  <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
                  <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
              </metadataFormat>
          </ListMetadataFormats>
      </OAI-PMH>`;
}

function listRecords(objectList: ObjectListItem[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
      <OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/
              http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
          <responseDate>${currentDate}</responseDate>
          <request verb="ListRecords" metadataPrefix="oai_dc">
              ${projectData.base_url}/oai-pmh
          </request>
          <ListRecords>
  ${objectList
    .map(
      (object) =>
        `<record>
              <header>
                  <identifier>${object.id}</identifier>
                  <datestamp>${currentDate}</datestamp>
              </header>
              <metadata>
                  <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
                              xmlns:dc="http://purl.org/dc/elements/1.1/"
                              xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/
                              http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
                      <dc:title>${object.title}</dc:title>
                      <dc:type>Text</dc:type>
                      <dc:identifier>${projectData.download_url}/${object.id}</dc:identifier>
                  </oai_dc:dc>
              </metadata>
          </record>`,
    )
    .join("\n")}
          </ListRecords>
          </OAI-PMH>`;
}

// helpers
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
