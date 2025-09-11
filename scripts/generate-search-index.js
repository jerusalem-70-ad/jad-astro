import { log } from "@acdh-oeaw/lib";
// import { getData } from "./api-client.js";
import { createTypesenseAdminClient } from "../scripts/create-typesense-admin-client.js";
import { collectionName } from "../config/search.config.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(__dirname, "../src/content/data", file), "utf8")
  );

const data = Object.values(loadJSON("passages.json"));

// function to normalize text spelling
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .replace(/ae/g, "e")
    .replace(/oe/g, "e")
    .replace(/j/g, "i")
    .replace(/v/g, "u")
    .replace(/^\s*\d+\s*/, "") // remove leading numbers/tabs/spaces
    .replace(/\s+/g, " ") // collapse multiple spaces/tabs/newlines
    .trim(); // remove leading/trailing whitespace
};

async function generate() {
  // instantiate typesense client using helpers function
  const client = createTypesenseAdminClient();

  // check if the collection exist if so delete and write anew

  try {
    // Check if the collection exists
    const collections = await client.collections().retrieve();
    const collectionExists = collections.some(
      (collection) => collection.name === collectionName
    );

    if (collectionExists) {
      // If the collection exists, delete it
      await client.collections(collectionName).delete();
      log.success(`Deleted the existing collection: ${collectionName}`);
    }
  } catch (error) {
    log.error("Error while checking or deleting collection:\n", String(error));
  }

  // create collection
  const schema = {
    name: collectionName,
    enable_nested_fields: true,
    fields: [
      { name: "id", type: "string", sort: true },
      { name: "sort_id", type: "int32", sort: true },
      { name: "rec_id", type: "string", sort: true },
      { name: "title", type: "string", sort: true, facet: true },
      { name: "full_text", type: "string", sort: true },
      { name: "search_text", type: "string", sort: true },
      { name: "manuscripts", type: "object[]", facet: true, optional: true },
      { name: "work", type: "object[]", facet: true, optional: true },
      {
        name: "liturgical_references",
        type: "object[]",
        facet: true,
        optional: true,
      },
      {
        name: "biblical_ref_lvl0",
        type: "string[]",
        facet: true,
        optional: true,
      },
      {
        name: "biblical_ref_lvl1",
        type: "string[]",
        facet: true,
        optional: true,
      },

      { name: "cluster", type: "object[]", facet: true, optional: true },
      { name: "keywords", type: "object[]", facet: true, optional: true },
      // get dates as separate numbers for filtering 'from -to' in the frontend
      { name: "work_date_not_before", type: "int32", facet: true, sort: true },
      { name: "work_date_not_after", type: "int32", facet: true, sort: true },
    ],
    default_sorting_field: "sort_id",
  };

  await client.collections().create(schema);
  log.success("Created new collection");

  // transform data so it conforms to the typesense collection shape
  const records = [];
  Object.values(data)
    .filter((value) => value.passage !== "")
    .forEach((value) => {
      const workDate = value.work?.[0]?.date[0] || {};
      const item = {
        sort_id: value.id,
        id: value.jad_id,
        rec_id: value.jad_id,
        title: value.passage,
        full_text: `${value.passage} ${value.text_paragraph}`,
        search_text: `${normalizeText(value.passage ?? "")} ${normalizeText(
          value.text_paragraph ?? ""
        )}`,
        manuscripts: value.mss_occurrences || [],
        work: value.work || [],
        cluster: value.part_of_cluster || [],
        liturgical_references: value.liturgical_references || [],
        biblical_ref_lvl0: value.biblical_ref_lvl0 || [],
        biblical_ref_lvl1: value.biblical_ref_lvl1 || [],
        keywords: value.keywords || [],
        work_date_not_before: workDate.not_before || 70,
        work_date_not_after: workDate.not_after || 1600,
      };
      records.push(item);
    });
  // - import data into typesense collection

  await client.collections(collectionName).documents().import(records);
  log.success("All imported");

  // create synonyms
  const jerusalem_synonym = {
    synonyms: ["jerusalem", "ierusalem", "hierusalem"],
  };

  await client
    .collections(collectionName)
    .synonyms()
    .upsert("jerusalem-synonyms", jerusalem_synonym);
  log.success("Created synonyms for Jerusalem");
}

generate()
  .then(() => {
    log.success("All good.");
  })
  .catch((error) => {
    log.error("Oh no!\n", String(error));
    process.exitCode = 1;
  });
