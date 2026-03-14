import { Client } from "typesense";

export function createTypesenseClient() {
  const client = new Client({
    nodes: [
      {
        host: "typesense.acdh-dev.oeaw.ac.at",
        port: 443,
        protocol: "https",
      },
    ],
    apiKey: "IA6BWzRrMo7yX3eFqgcFelJzhWkIl64W",
    connectionTimeoutSeconds: 5,
  });

  return client;
}
