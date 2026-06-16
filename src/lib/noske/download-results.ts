// script to use the jad_id from noske search results to fetch the data for each passage from the public/data/passages folder
// and offer as a download
import { withBasePath } from "../withBasePath";

type PassageData = {
  id: number;
  jad_id: string;
  work?: { author?: string; title?: string }[];
  position_in_work?: string;
  text_paragraph?: string;
};

type KwicResult = {
  jad_id: string;
  leftText: string;
  kwicText: string;
  rightText: string;
};

type ExportRow = {
  id: number;
  jad_id: string;

  author: string;
  title: string;
  position: string;

  text: string;

  leftText: string;
  kwicText: string;
  rightText: string;
};

// minimal metadata stored in public/passages
export async function fetchPassages(
  results: KwicResult[],
): Promise<PassageData[]> {
  const uniqueJadIds = [...new Set(results.map((r) => r.jad_id))];

  const passages = await Promise.all(
    uniqueJadIds.map(async (jadId) => {
      const response = await fetch(
        withBasePath(`/data/passages/${jadId}.json`),
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch passage ${jadId}`);
      }

      return response.json();
    }),
  );

  return passages;
}

// merge metadata from the fetched min passage metadata and the kwic from noske resuults
function getExportData(
  passages: PassageData[],
  results: KwicResult[],
): ExportRow[] {
  const passageMap = new Map(passages.map((p) => [p.jad_id, p]));

  return results.map((result) => {
    const passage = passageMap.get(result.jad_id);

    return {
      id: passage?.id ?? 0,
      jad_id: result.jad_id,

      author: passage?.work?.[0]?.author ?? "",
      title: passage?.work?.[0]?.title ?? "",
      position: passage?.position_in_work ?? "",

      text: passage?.text_paragraph ?? "",

      leftText: result.leftText,
      kwicText: result.kwicText,
      rightText: result.rightText,
    };
  });
}

// the actual function to be called inside noske-custom-search
// csv simple only the metadata NO kwic
export async function downloadCsv(results: KwicResult[]) {
  const passages = await fetchPassages(results);

  const data = getExportData(passages, results);

  const header = ["id", "author", "title", "position", "text"];

  const rows = data.map((row) =>
    header
      .map(
        (key) => `"${String(row[key as keyof ExportRow]).replace(/"/g, '""')}"`,
      )
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  downloadFile(csv, "jad-passages.csv", "text/csv");
}

//html export merges the kwic as mark element and the fetched metadata
export async function downloadHtml(
  results: KwicResult[],
  currentQuery: string,
) {
  const passages = await fetchPassages(results);

  const data = getExportData(passages, results);
  const query = currentQuery;
  const body = data
    .map(
      (row) => `
<article>
  <h2>#${row.id} ${row.title}</h2>

  <p>
    <strong>Author:</strong>
    ${row.author}
  </p>

  <p>
    <strong>Position:</strong>
    ${row.position}
  </p>

  <blockquote>
  <span>${row.leftText}</span>
  <mark>${row.kwicText}</mark>
    <span>${row.rightText}</span>
  </blockquote>
</article>
`,
    )
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>JAD Linguistic Search Export</title>

<style>
body {
  font-family: serif;
  max-width: 900px;
  margin: auto;
  line-height: 1.5;
}

article {
  margin-bottom: 2rem;
  page-break-inside: avoid;
}

blockquote {
  margin-left: 2rem;
}
</style>
</head>

<body>

<h1>JAD Linguistic Search Export</h1>
<p>Query: ${query}</p>
<p>
Generated: ${new Date().toLocaleString()}
</p>

${body}

</body>
</html>
`;

  downloadFile(html, "jad-passages.html", "text/html");
}

// helper function to trigger download for csv and html
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  a.click();

  URL.revokeObjectURL(url);
}
