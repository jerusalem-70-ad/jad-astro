import { Client } from "typesense";

export function createTypesenseClient() {
  const client = new Client({
    nodes: [
      {
        host: import.meta.env.TYPESENSE_API_HOST,
        port: import.meta.env.TYPESENSE_API_PORT,
        protocol: import.meta.env.TYPESENSE_API_PROTOCOL,
      },
    ],
    apiKey: import.meta.env.TYPESENSE_SEARCH_API_KEY,
    connectionTimeoutSeconds: 2,
  });

  return client;
}
