import { Client } from "typesense";
import { log } from "@acdh-oeaw/lib";

export function createTypesenseAdminClient() {
  const client = new Client({
    nodes: [
      {
        host: process.env.PUBLIC_TYPESENSE_API_HOST,
        port: process.env.PUBLIC_TYPESENSE_API_PORT,
        protocol: process.env.PUBLIC_TYPESENSE_API_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
    connectionTimeoutSeconds: 2,
  });

  return client;
}

// function to create synonyms for Jerusalem

export async function createJerusalemSynonyms(collectionName = "JAD-temp") {
  try {
    const client = createTypesenseAdminClient();
    const synonym = {
      synonyms: ["hierusalem", "jerusalem", "ierusalem"],
    };

    const result = await client
      .collections(collectionName)
      .synonyms()
      .upsert("jerusalem-synonyms", synonym);
    log.success("Jerusalem synonyms created:", result);
    return result;
  } catch (error) {
    log.error("Error creating Jerusalem synonyms:", String(error));
    throw error;
  }
}

// More general function for creating any synonyms
export async function createSynonyms(collectionName, synonymId, synonymsArray) {
  try {
    const client = createTypesenseAdminClient();
    const synonym = {
      synonyms: synonymsArray,
    };

    const result = await client
      .collections(collectionName)
      .synonyms()
      .upsert(synonymId, synonym);
    log.success(`Synonyms '${synonymId}' created:`, result);
    return result;
  } catch (error) {
    log.error(`Error creating synonyms '${synonymId}':`, String(error));
    throw error;
  }
}
