import { Client } from "typesense";

export function createTypesenseClient() {
  const client = new Client({
    nodes: [
      {
        host: import.meta.env.PUBLIC_TYPESENSE_API_HOST,
        port: import.meta.env.PUBLIC_TYPESENSE_API_PORT,
        protocol: import.meta.env.PUBLIC_TYPESENSE_API_PROTOCOL,
      },
    ],
    apiKey: import.meta.env.PUBLIC_TYPESENSE_SEARCH_API_KEY,
    connectionTimeoutSeconds: 2,
  });

  return client;
}
