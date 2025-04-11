import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "src/content/data", file), "utf8")
  );

const passages = Object.values(loadJSON("passages.json"));

const folderPath = join(process.cwd(), "src", "content", "data");
mkdirSync(folderPath, { recursive: true });

// Helper to extract metadata for a passage
function extractMeta(passage) {
  const work = passage.work?.[0] || {};
  const author = work.author?.[0] || {};
  return {
    jad_id: passage.jad_id || "",
    work: work.name || "",
    author: author.name || "",
  };
}

function createGraph(passages) {
  const lookup = {};
  const graph = {};

  // Index all passages by id
  passages.forEach((p) => {
    lookup[p.id] = p;
    graph[p.id] = {
      id: p.id,
      sources: [],
      targets: [],
    };
  });

  // Build connections with enriched metadata
  passages.forEach((p) => {
    if (p.source_passage) {
      p.source_passage.forEach((src) => {
        const sourcePassage = lookup[src.id];
        if (sourcePassage) {
          const srcMeta = extractMeta(sourcePassage);
          const targetMeta = extractMeta(p);

          // Add enriched metadata to both directions
          graph[p.id].sources.push({
            id: src.id,
            ...srcMeta,
          });

          graph[src.id].targets.push({
            id: p.id,
            ...targetMeta,
          });
        }
      });
    }
  });

  return graph;
}

const graph = createGraph(passages);

// Add transmission_graph to each passage
passages.forEach((p) => {
  const node = graph[p.id];
  p.transmission_graph = {
    sources: node.sources,
    targets: node.targets,
  };
});

// Save result
writeFileSync(
  join(folderPath, "passages_with_transmission_graph.json"),
  JSON.stringify(passages, null, 2),
  "utf-8"
);

console.log("Passage graph with enriched source/target metadata generated.");
