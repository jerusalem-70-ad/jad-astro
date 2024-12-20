import { log } from "@acdh-oeaw/lib";
import { getData } from "./api-client.js";
import { createTypesenseAdminClient } from "../scripts/create-typesense-admin-client.js";
import { collectionName } from "../config/search.config.js";

async function generate() {
  // instantiate typesense client using helpers function
  const client = createTypesenseAdminClient();

  // check if the collection exist if so delete and write anew
  await client.collections(collectionName).delete();
  log.success("Deleted the collection");

  // create collection
  const schema = {
    name: collectionName,
    enable_nested_fields: true,
    fields: [
      { name: "id", type: "string", sort: true },
      { name: "rec_id", type: "string", sort: true },
      { name: "title", type: "string", sort: true },
      { name: "full_text", type: "string", sort: true },
      { name: "language", type: "object", facet: true, optional: true },
      { name: "manuscript", type: "object[]", facet: true, optional: true },
      { name: "work", type: "object[]", facet: true, optional: true },
    ],
    default_sorting_field: "title",
  };

  await client.collections().create(schema);
  log.success("Created new collection");
  // import data into typesense collection

  //  get data from github
  const data = await getData(
    "https://raw.githubusercontent.com/jerusalem-70-ad/jad-baserow-dump/refs/heads/main/data/",
    "passages.json"
  );
  // transform data so it conforms to the typesense collection shape
  const records = [];
  Object.values(data).forEach((value) => {
    const item = {
      id: value.jad_id,
      rec_id: `${value.jad_id}`,
      title: value.passage,
      full_text: `${value.passage} ${value.text_paragraph}`,
      language: value.language,
      manuscript: value.manuscript,
      work: value.work,
    };
    records.push(item);
  });
  // - import data into typesense collection

  await client.collections(collectionName).documents().import(records);
  log.success("All imported");
}

generate()
  .then(() => {
    log.success("All good.");
  })
  .catch((error) => {
    log.error("Oh no!\n", String(error));
    process.exitCode = 1;
  });
