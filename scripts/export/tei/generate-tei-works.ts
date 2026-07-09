import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { WorkFull } from "@/types";
import main from "./main-tei-work";
import { log } from "@acdh-oeaw/lib";

const outputDir = join(process.cwd(), "public", "download", "tei", "works");
const donwloadDir = join(process.cwd(), "public", "download");
mkdirSync(donwloadDir, { recursive: true });

mkdirSync(outputDir, { recursive: true });
function writeXMLFile(filename: string, content: string) {
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, content, "utf8");
  log.success(`Generated: ${filename} ${filepath}`);
}

function generateWorksXML() {
  const works: WorkFull[] = JSON.parse(
    readFileSync("src/content/data/works.json", "utf-8"),
  );

  for (const work of works) {
    const xml = main(work);
    writeXMLFile(`${work.jad_id}.xml`, xml);
  }
  log.success(works.length, " TEI-XML and JSON generated");

  const rows = works
    .map((p) => {
      const teiFilename = `${p.jad_id}.xml`;
      const author = p.author.length > 0 ? p.author[0].name : ``;
      const title = p.title;
      let titleAuthor = title;

      if (author && title) {
        titleAuthor = `${author}: ${title}`;
      }

      return `
      <tr>
        <td>${p.jad_id ?? ""}</td>
        <td>${titleAuthor ?? ""}</td>
        <td><a href="./tei/works/${teiFilename}" download="${teiFilename}">${teiFilename}</a></td>
      </tr>
    `;
    })
    .join("\n");

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Download Files for Works</title>
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
  <h1>Download Files for Works</h1>
  <p>${works.length} works</p>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Work</th>
        <th>TEI File</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

  writeFileSync(join(donwloadDir, "works.html"), indexHtml, "utf8");

  console.log("Generated download html");
}
generateWorksXML();
