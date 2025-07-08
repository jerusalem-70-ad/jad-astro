import { Eta } from "eta";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { DOMParser } from "@xmldom/xmldom";
import { XMLValidator } from "fast-xml-parser";
import { enrichDates } from "./utils.js";

/**
 * Fast well-formedness validation
 * @param {string} xmlContent - XML content
 * @param {string} filename - Filename
 * @returns {object} Validation result
 */
function validateWellFormedness(xmlContent, filename) {
  const errors = [];

  try {
    // First check: fast-xml-parser (very fast)
    const isValid = XMLValidator.validate(xmlContent, {
      allowBooleanAttributes: true,
      ignoreAttributes: false,
      ignoreNameSpace: false,
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: true,
    });

    if (isValid !== true) {
      errors.push(
        `XML Parser: ${isValid.err?.msg || "Invalid XML"} at line ${
          isValid.err?.line || "unknown"
        }`
      );
    }

    // Second check: xmldom parser (more thorough)
    const errorHandler = {
      warning: (msg) => {
        // Only log serious warnings
        if (
          msg.includes("missing") ||
          msg.includes("invalid") ||
          msg.includes("not well-formed")
        ) {
          errors.push(`Warning: ${msg}`);
        }
      },
      error: (msg) => errors.push(`Error: ${msg}`),
      fatalError: (msg) => errors.push(`Fatal Error: ${msg}`),
    };

    const parser = new DOMParser({ onError: errorHandler });
    const doc = parser.parseFromString(xmlContent, "application/xml");

    // Check for parser errors in the document
    if (doc.documentElement) {
      const parserErrors = doc.getElementsByTagName("parsererror");
      if (parserErrors.length > 0) {
        errors.push(`Parser error: ${parserErrors[0].textContent}`);
      }
    } else {
      errors.push("No valid document element found");
    }

    return {
      success: errors.length === 0,
      errors: errors,
      filename: filename,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Exception: ${error.message}`],
      filename: filename,
    };
  }
}

// Function to load JSON files from the data directory
const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "src/content/data", file), "utf8")
  );

// Main execution
async function main() {
  console.log(
    "🏗️  Starting TEI works generation with well-formedness validation..."
  );
  // Load data files
  console.log("📖 Loading data files...");
  const manuscripts = Object.values(loadJSON("manuscripts.json"));
  const passages = loadJSON("passages.json");
  const dates = Object.values(loadJSON("dates.json"));
  const works = loadJSON("works.json");
  const keywords = Object.values(loadJSON("keywords.json"));
  const clusters = Object.values(loadJSON("clusters.json"));
  const liturgical_references = Object.values(
    loadJSON("liturgical_references.json")
  );

  // Create lookup maps (your existing logic)
  console.log("🔗 Creating lookup maps...");
  const passagesByWorkId = new Map();
  passages.forEach((passage) => {
    if (!passage.work || passage.work.length === 0) return;
    const workJadId = passage.work[0].jad_id;
    if (!passagesByWorkId.has(workJadId)) {
      passagesByWorkId.set(workJadId, []);
    }
    passagesByWorkId.get(workJadId).push(passage);
  });

  const manuscriptById = new Map();
  manuscripts.forEach((ms) => {
    if (Array.isArray(ms.date_written)) {
      ms.date_written = enrichDates(ms.date_written, dates);
    }
    manuscriptById.set(ms.id, ms);
    if (ms.jad_id) manuscriptById.set(ms.jad_id, ms);
  });

  // Set the output folder
  const worksFolderPath = join(process.cwd(), "public", "tei", "works");
  mkdirSync(worksFolderPath, { recursive: true });

  // Eta views path
  const eta = new Eta({ views: join(process.cwd(), "tei-templates") });

  console.log(
    `🏭 Generating and validating TEI for ${works.length} works...\n`
  );

  // Performance tracking
  const startTime = Date.now();
  let validationTime = 0;

  let successCount = 0;
  let wellFormednessErrors = 0;
  const validationResults = [];

  // Process each work
  for (const [index, work] of works.entries()) {
    const filename = work.jad_id ? `${work.jad_id}.xml` : `work_${work.id}.xml`;

    try {
      // Enrich work data (your existing logic)
      if (work.manuscripts.length > 0) {
        work.full_manuscripts = work.manuscripts
          .map((ref) => manuscriptById.get(ref.id))
          .filter(Boolean);
      }

      work.passages = passagesByWorkId.get(work.jad_id) || [];
      work.taxonomy_keywords = keywords;
      work.taxonomy_clusters = clusters;
      work.taxonomy_liturgical_references = liturgical_references;

      // Render the template with data
      const xml = eta.render("./work.eta", work);

      // Well-formedness validation (with timing)
      const validationStart = Date.now();
      const wellFormedness = validateWellFormedness(xml, filename);
      const validationEnd = Date.now();
      validationTime += validationEnd - validationStart;

      if (!wellFormedness.success) {
        console.log(
          `❌ [${index + 1}/${works.length}] ${filename} - Validation failed:`
        );
        wellFormedness.errors.forEach((error) => {
          console.log(`   ${error}`);
        });
        wellFormednessErrors++;
        validationResults.push({ ...wellFormedness, type: "well-formedness" });

        // Write invalid files with .invalid extension for debugging
        writeFileSync(join(worksFolderPath, `${filename}.invalid`), xml);
        continue;
      }

      // Write the valid XML file
      writeFileSync(join(worksFolderPath, filename), xml);
      successCount++;
    } catch (error) {
      console.log(
        `💥 [${index + 1}/${works.length}] Error processing work:`,
        error.message
      );
      wellFormednessErrors++;
      validationResults.push({
        filename: filename,
        success: false,
        errors: [error.message],
        type: "generation",
      });
    }
  }

  const totalTime = Date.now() - startTime;

  // Summary
  console.log("\n═══════════════════════════════════════");
  console.log("🏁 GENERATION & VALIDATION SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`📊 Total works: ${works.length}`);
  console.log(`✅ Successfully generated: ${successCount}`);
  console.log(`❌ Well-formedness errors: ${wellFormednessErrors}`);
  console.log(`🔧 Validation method: fast well-formedness only`);
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`⏱️  Validation time: ${(validationTime / 1000).toFixed(1)}s`);
  console.log(
    `⏱️  Average per file: ${(
      validationTime /
      Math.max(successCount, 1) /
      1000
    ).toFixed(3)}s`
  );

  if (validationResults.length > 0) {
    console.log("\n📋 Files with issues:");
    validationResults.forEach((result) => {
      console.log(`   • ${result.filename} (${result.type})`);
    });
  }

  // Exit codes for CI
  if (wellFormednessErrors > 0) {
    console.log("\n💥 Well-formedness errors found - failing build");
    process.exit(1);
  } else {
    console.log(
      "\n🎉 All TEI files generated successfully and are well-formed!"
    );
  }
}

// Run the main function
main().catch((error) => {
  console.error("💥 Fatal error:", error.message);
  process.exit(1);
});
