import { Client } from "typesense";

export function createTypesenseAdminClient() {
  console.log("TYPESENSE_ADMIN_API_KEY:", process.env.TYPESENSE_ADMIN_API_KEY);
  console.log("PUBLIC_TYPESENSE_API_HOST:", process.env.PUBLIC_TYPESENSE_API_HOST);
  console.log("PUBLIC_TYPESENSE_API_PORT:", process.env.PUBLIC_TYPESENSE_API_PORT);
  console.log("PUBLIC_TYPESENSE_API_PROTOCOL:", process.env.PUBLIC_TYPESENSE_API_PROTOCOL);

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
