import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { Keyword } from "@/types";

import { makeKeywordSkos } from "./taxonomies";

const keywords: Keyword[] = JSON.parse(
  readFileSync("src/content/data/keywords.json", "utf-8"),
);

const taxonomyDir = join(process.cwd(), "public", "download", "taxonomies");

mkdirSync(taxonomyDir, { recursive: true });

writeFileSync(
  join(taxonomyDir, "jad-keywords.xml"),
  makeKeywordSkos(keywords),
  "utf8",
);
