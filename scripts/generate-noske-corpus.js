import { log } from "@acdh-oeaw/lib";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to load JSON data from your content directory
const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(__dirname, "../src/content/data", file), "utf8")
  );

// Load your passages data
const data = Object.values(loadJSON("passages.json"));

// Simple tokenizer function to split text into words
function tokenize(text) {
  if (!text) return [];

  // Split on whitespace and punctuation, but keep punctuation as separate tokens
  // This regex splits on whitespace but keeps punctuation attached or separate
  return text
    .split(/(\s+)/) // Split on whitespace, keeping the whitespace
    .map((token) => token.trim())
    .filter((token) => token.length > 0) // Remove empty strings
    .flatMap((token) => {
      // Further split punctuation from words
      // e.g., "Jerusalem," becomes ["Jerusalem", ","]
      const parts = token.split(/([.,;:!?()[\]{}"""''])/).filter(Boolean);
      return parts;
    });
}

//function to escape characters like & < > " '
function escapeXML(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;") // Must be first!
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// function to get the author name as a string
function getAuthorName(passage) {
  if (
    !passage.work ||
    !Array.isArray(passage.work) ||
    passage.work.length === 0
  ) {
    return "Unknown Author";
  }

  const work = passage.work[0];
  if (!work.author || !Array.isArray(work.author) || work.author.length === 0) {
    return "Unknown Author";
  }

  return work.author[0].name || "Unknown Author";
}

//function to get the work title as a string
function getWorkTitle(passage) {
  if (
    !passage.work ||
    !Array.isArray(passage.work) ||
    passage.work.length === 0
  ) {
    return "Unknown Work";
  }

  return passage.work[0].title || "Unknown Work";
}

// function to get the work date as a string
function getWorkDate(passage) {
  if (
    !passage.work ||
    !Array.isArray(passage.work) ||
    passage.work.length === 0
  ) {
    return "";
  }

  const work = passage.work[0];
  if (!work.date || !Array.isArray(work.date) || work.date.length === 0) {
    return "";
  }

  return work.date[0].not_before || "";
}

/**
 * MAIN GENERATION FUNCTION
 *
 * This creates the vertical format corpus file that NoSketch Engine needs.
 *
 * Structure explained:
 * 1. <doc> tag: Represents one passage (your database record)
 *    - Contains metadata as attributes (id, author, work, etc.)
 *    - This metadata will be displayed in search results
 *
 * 2. <p> tag: Represents a paragraph of text
 *    - Contains the actual searchable words
 *    - Each word is on its own line
 *
 * 3. Words: One per line, these are what users search through
 */
function generateVerticalFormat() {
  let output = "";
  let processedCount = 0;
  let skippedCount = 0;

  // Filter out empty passages (passages with no text)
  const validPassages = data.filter((passage) => {
    const hasPassageText = passage.passage && passage.passage.trim() !== "";
    const hasParaText =
      passage.text_paragraph && passage.text_paragraph.trim() !== "";
    return hasPassageText || hasParaText;
  });

  log.info(
    `Processing ${validPassages.length} passages out of ${data.length} total`
  );

  validPassages.forEach((passage, index) => {
    try {
      // Extract metadata for this passage
      const jadId = escapeXML(passage.jad_id || "");
      const numericId = escapeXML(String(passage.id || ""));
      const author = escapeXML(getAuthorName(passage));
      const workTitle = escapeXML(getWorkTitle(passage));
      const workDate = escapeXML(String(getWorkDate(passage)));
      const passageTitle = escapeXML(passage.passage || "");

      // Start the document structure
      // IMPORTANT: These attributes will be available in NoSketch search results!
      // The acdh-noske-search UI can display these in the results
      output += `<doc id="${jadId}" numeric_id="${numericId}" author="${author}" work_title="${workTitle}" work_date="${workDate}" passage_title="${passageTitle}">\n`;

      // Combine passage and text_paragraph for searching
      // Both fields will be searchable as one continuous text
      const fullText = [passage.passage || "", passage.text_paragraph || ""]
        .filter((text) => text.trim() !== "")
        .join(" ");

      // Tokenize the text into individual words
      const tokens = tokenize(fullText);

      if (tokens.length === 0) {
        log.warn(`Warning: Passage ${jadId} has no tokens after processing`);
        skippedCount++;
        output += "</doc>\n";
        return;
      }

      // Start paragraph structure
      output += "<p>\n";

      // Write each word on its own line
      // This is the core of the vertical format!
      tokens.forEach((token) => {
        // Escape the token for XML safety
        const escapedToken = escapeXML(token);
        output += escapedToken + "\n";
      });

      // Close paragraph and document
      output += "</p>\n";
      output += "</doc>\n";

      processedCount++;

      // Log progress every 100 passages
      if ((index + 1) % 100 === 0) {
        log.info(`Processed ${index + 1}/${validPassages.length} passages`);
      }
    } catch (error) {
      log.error(
        `Error processing passage ${passage.jad_id || passage.id}:`,
        error
      );
      skippedCount++;
    }
  });

  log.success(`Successfully processed ${processedCount} passages`);
  if (skippedCount > 0) {
    log.warn(`Skipped ${skippedCount} passages due to errors or empty content`);
  }

  return output;
}

/**
 * MAIN EXECUTION FUNCTION
 */
async function generate() {
  log.info("Starting NoSketch Engine corpus generation...");
  log.info(`Total passages in data: ${data.length}`);

  // Generate the vertical format text
  const verticalText = generateVerticalFormat();

  // Create output directory if it doesn't exist
  const outputDir = join(__dirname, "../noske-corpus");
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }

  // Save to a .vert file (vertical format extension)
  const outputPath = join(outputDir, "jad-passages.vert");
  writeFileSync(outputPath, verticalText, "utf8");

  log.success(`Corpus saved to: ${outputPath}`);

  // Calculate file size for user info
  const stats = require("fs").statSync(outputPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  log.info(`File size: ${fileSizeInMB} MB`);

  // Provide next steps
  log.info("\n=== NEXT STEPS ===");
  log.info("1. Contact your NoSketch Engine administrator at your institution");
  log.info("2. Request creation of a new corpus with these details:");
  log.info("   - Corpus name: jad_passages");
  log.info("   - Language: Latin (or specify if different)");
  log.info("   - Structures: doc, p");
  log.info("   - Attributes: word (default)");
  log.info(
    "   - Document attributes: id, numeric_id, author, work_title, work_date, passage_title"
  );
  log.info("3. Upload this file: " + outputPath);
  log.info(
    '4. After upload, test with a simple query like: [word="Jerusalem"]'
  );
  log.info("\n=== FOR WILDCARD SEARCHES ===");
  log.info("Users can search with CQL (Corpus Query Language):");
  log.info('  - Wildcard: [word=".*salem.*"] (matches Jerusalem, salem, etc.)');
  log.info('  - Word distance: [word="holy"] []{0,5} [word="city"]');
  log.info('  - Complex: [word="Jerusalem"] []{0,3} [word="temple|church"]');
}

// Execute the generation
generate()
  .then(() => {
    log.success("\n✅ All done! Corpus file ready for upload.");
  })
  .catch((error) => {
    log.error("❌ Error generating corpus:\n", String(error));
    process.exitCode = 1;
  });
