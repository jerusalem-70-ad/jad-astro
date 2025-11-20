import { Eta } from "eta";
import { join } from "path";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  copyFileSync,
} from "fs";
import { XMLValidator } from "fast-xml-parser";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const eta = new Eta({
  views: join(process.cwd(), "oai-pmh-templates"),
  cache: false,
});

const projectData = {
  project_title: "Medieval Reception of the Roman Conquest of Jerusalem",
  base_url: "https://jerusalem-70-ad.github.io/jad-astro",
};

// Helper to format and validate XML
function formatXML(xmlString) {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const doc = parser.parseFromString(xmlString, "application/xml");
  return serializer.serializeToString(doc);
}

function validateXML(xmlContent, filename) {
  const result = XMLValidator.validate(xmlContent, {
    allowBooleanAttributes: true,
    ignoreAttributes: false,
  });

  if (result !== true) {
    console.error(`❌ XML validation failed for ${filename}:`, result.err);
    return false;
  }
  return true;
}

async function main() {
  console.log("🏗️  Generating OAI-PMH files for passages...\n");

  // Create output folder
  const oaiFolder = join(process.cwd(), "public", "oai-pmh");
  rmSync(oaiFolder, { recursive: true, force: true });
  mkdirSync(oaiFolder, { recursive: true });

  const currentDateTime = new Date().toISOString();
  const currentDate = currentDateTime.split("T")[0];

  // Load passages data
  const passages = JSON.parse(
    readFileSync(join(process.cwd(), "src/content/data/passages.json"), "utf-8")
  );

  // Build object list for passages
  const objectList = passages.map((passage) => ({
    id: `tei/passages/${passage.jad_id}.xml`,
    title:
      passage.passage ||
      passage.text_paragraph?.substring(0, 100) ||
      "Untitled Passage",
    datestamp: currentDate,
  }));

  console.log(`📝 Processing ${objectList.length} passages...\n`);

  // 1. Generate Identify.xml
  console.log("Generating Identify.xml...");
  const identifyXml = eta.render("Identify.eta", {
    project_data: projectData,
    current_date_time: currentDateTime,
  });

  const identifyPath = join(oaiFolder, "Identify.xml");
  writeFileSync(identifyPath, formatXML(identifyXml), "utf-8");

  if (validateXML(identifyXml, "Identify.xml")) {
    console.log("✅ Identify.xml created\n");
  }

  // 2. Generate ListRecords.xml
  console.log("Generating ListRecords.xml...");
  const listRecordsXml = eta.render("ListRecords.eta", {
    project_data: projectData,
    object_list: objectList,
    current_date_time: currentDateTime,
  });

  const listRecordsPath = join(oaiFolder, "ListRecords.xml");
  writeFileSync(listRecordsPath, formatXML(listRecordsXml), "utf-8");

  if (validateXML(listRecordsXml, "ListRecords.xml")) {
    console.log("✅ ListRecords.xml created\n");
  }

  // 3. Generate ListIdentifiers.xml
  console.log("Generating ListIdentifiers.xml...");
  const listIdentifiersXml = eta.render("ListIdentifiers.eta", {
    project_data: projectData,
    object_list: objectList,
    current_date_time: currentDateTime,
  });

  const listIdentifiersPath = join(oaiFolder, "ListIdentifiers.xml");
  writeFileSync(listIdentifiersPath, formatXML(listIdentifiersXml), "utf-8");

  if (validateXML(listIdentifiersXml, "ListIdentifiers.xml")) {
    console.log("✅ ListIdentifiers.xml created\n");
  }

  // 4. Generate ListMetadataFormats.xml (optional but good to have)
  console.log("Generating ListMetadataFormats.xml...");
  const listMetadataXml = eta.render("ListMetadataFormats.eta", {
    project_data: projectData,
    current_date_time: currentDateTime,
  });

  const listMetadataPath = join(oaiFolder, "ListMetadataFormats.xml");
  writeFileSync(listMetadataPath, formatXML(listMetadataXml), "utf-8");

  if (validateXML(listMetadataXml, "ListMetadataFormats.xml")) {
    console.log("✅ ListMetadataFormats.xml created\n");
  }

  // 5. Copy index.html (if it exists)
  console.log("Copying index.html...");
  const indexSource = join(process.cwd(), "oai-pmh", "index.html");
  const indexDest = join(oaiFolder, "index.html");

  try {
    copyFileSync(indexSource, indexDest);
    console.log("✅ index.html copied\n");
  } catch (error) {
    console.warn("⚠️  Warning: Could not copy index.html (file may not exist)");
    console.warn(`   Expected location: ${indexSource}\n`);
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
    console.log("✅ Generated basic index.html\n");
  }

  console.log("═══════════════════════════════════════");
  console.log("🎉 OAI-PMH generation complete!");
  console.log(`📊 Total passages indexed: ${objectList.length}`);
  console.log(`📁 Output folder: ${oaiFolder}`);
  console.log("═══════════════════════════════════════");
}

main().catch((error) => {
  console.error("💥 Fatal error:", error.message);
  process.exit(1);
});
