import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { Passage } from "@/types";
import main from "./main-tei";
import { log } from "@acdh-oeaw/lib";

const outputDir = join(process.cwd(), "public", "download", "tei", "passages");
const outputJSONDir = join(
  process.cwd(),
  "public",
  "download",
  "json",
  "passages",
);
const donwloadDir = join(process.cwd(), "public", "download");

mkdirSync(outputDir, { recursive: true });
mkdirSync(outputJSONDir, { recursive: true });
mkdirSync(donwloadDir, { recursive: true });
function writeXMLFile(filename: string, content: string) {
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, content, "utf8");
  log.success(`Generated: ${filename} ${filepath}`);
}

function writeJSON(filename: string, passage: Passage) {
  const filepath = join(outputJSONDir, filename);
  writeFileSync(filepath, JSON.stringify(passage, null, 2), "utf-8");
}

function generatePassagesDownloads() {
  const passages: Passage[] = JSON.parse(
    readFileSync("src/content/data/passages.json", "utf-8"),
  );

  for (const passage of passages) {
    const xml = main(passage);
    writeXMLFile(`${passage.jad_id}.xml`, xml);
    writeJSON(`${passage.jad_id}.json`, passage);
  }
  log.success(passages.length, " TEI-XML and JSON generated");

  const rows = passages
    .map((p) => {
      const teiFilename = `${p.jad_id}.xml`;
      const jsonFilename = `${p.jad_id}.json`;
      const author =
        p.work[0]?.author.length > 0 ? p.work[0]?.author[0].name : ``;
      const title = p.work[0]?.title;
      const position = p.position_in_work;
      let titleAuthor = title;

      if (author && title) {
        titleAuthor = `${author}: ${title}`;
      }

      if (position && titleAuthor) {
        titleAuthor += ` (${position})`;
      }

      return `
      <tr>
        <td>${p.jad_id ?? ""}</td>
        <td>${titleAuthor ?? ""}</td>
        <td><a href="./tei/passages/${teiFilename}" download="${teiFilename}">${teiFilename}</a></td>
        <td><a href="./json/passages/${jsonFilename}" download="${jsonFilename}">${jsonFilename}</a></td>
      </tr>
    `;
    })
    .join("\n");

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Download Files for Manuscripts</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 2rem;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f5f5f5;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
  </style>
</head>
<body>
  <h1>Download Files for Passages</h1>
  <p>${passages.length} passages</p>

  <table>
    <thead>
      <tr>
        <th>Passage ID</th>
        <th>Work</th>
        <th>TEI File</th>
        <th>JSON File</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  writeFileSync(join(donwloadDir, "index.html"), indexHtml, "utf8");

  log.success("Generated download index.html");
}

generatePassagesDownloads();
