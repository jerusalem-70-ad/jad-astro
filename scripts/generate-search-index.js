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
      {
        name: "biblical_ref_lvl2",
        type: "string[]",
        facet: true,
        optional: true,
      },
      { name: "cluster", type: "object[]", facet: true, optional: true },
      { name: "keywords", type: "object[]", facet: true, optional: true },
      { name: "sources", type: "object[]", facet: true, optional: true },
    ],
    default_sorting_field: "sort_id",
  };

  await client.collections().create(schema);
  log.success("Created new collection");
  // import data into typesense collection

  //  get data from github
  /*  const data = await getData(
    "https://raw.githubusercontent.com/jerusalem-70-ad/jad-baserow-dump/refs/heads/main/data/",
    "passages.json"
  ); */

  // preprocess data

  // transform data so it conforms to the typesense collection shape
  const records = [];
  Object.values(data)
    .filter((value) => value.passage !== "")
    .forEach((value) => {
      const ancestorNodes =
        value.transmission_graph?.graph?.nodes?.filter(
          (node) => node.nodeType === "ancestor" && node.depth === 0
        ) || [];
      const item = {
        sort_id: value.id,
        id: value.jad_id,
        rec_id: value.jad_id,
        title: value.passage,
        full_text: `${value.passage} ${value.text_paragraph}`,
        manuscripts: value.manuscripts || [],
        work: value.work || [],
        cluster: value.part_of_cluster || [],
        liturgical_references: value.liturgical_references || [],
        biblical_ref_lvl0: value.biblical_ref_lvl0 || [],
        biblical_ref_lvl1: value.biblical_ref_lvl1 || [],
        biblical_ref_lvl2: value.biblical_ref_lvl2 || [],
        keywords: value.keywords || [],
        sources: ancestorNodes,
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
