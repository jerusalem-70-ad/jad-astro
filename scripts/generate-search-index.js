import { Client } from "typesense";
import { getData } from "./api-client.js";

async function generate() {
  // instantiate typesense client

  const client = new Client({
    nodes: [
      {
        host: process.env.TYPESENSE_API_HOST,
        port: process.env.TYPESENSE_API_PORT,
        protocol: process.env.TYPESENSE_API_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
    connectionTimeoutSeconds: 2,
  });

  // create collection

  const collectionName = "JAD-temp";

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

  // import data into typesense collection

  // TODO:
  // - get data from github
  const data = await getData(
    "https://raw.githubusercontent.com/jerusalem-70-ad/jad-baserow-dump/refs/heads/main/data/",
    "passages.json"
  );
  // - maybe transform data so it conforms to the typesense collection shape
  const records = [];
  Object.values(data).forEach((value) => {
    const item = {
      id: value["jad_id"],
      rec_id: `${value[jad_id].html}`,
      title: value["passage"],
      full_text: `${value["passage"]} ${value["text_paragraph"]}`,
      language: value["language"],
      manuscript: value["manuscript"],
      work: value["work"],
    };
    records.push(item);
  });
  // - import data into typesense collection

  client.collections(collectionName).documents().import(records);
}

generate();
