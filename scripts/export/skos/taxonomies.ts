import type { Keyword } from "@/types";
import { escapeSpecialCharacters } from "../tei/partials/helpers";

export function makeKeywordSkos(keywords: Keyword[]): string {
  // Group keywords by their top concept
  const taxonomy = new Map<string, Keyword[]>();

  for (const keyword of keywords) {
    if (!taxonomy.has(keyword.part_of)) {
      taxonomy.set(keyword.part_of, []);
    }
    taxonomy.get(keyword.part_of)!.push(keyword);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:skos="http://www.w3.org/2004/02/skos/core#">

<skos:ConceptScheme rdf:about="#jad-keywords">
    <skos:prefLabel xml:lang="en">JAD Keywords</skos:prefLabel>
</skos:ConceptScheme>

`;

  for (const [group, concepts] of taxonomy) {
    const groupId = group
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    xml += `<skos:Concept rdf:about="#${groupId}">
    <skos:prefLabel xml:lang="en">${escapeSpecialCharacters(group)}</skos:prefLabel>
    <skos:topConceptOf rdf:resource="#jad-keywords"/>
    <skos:inScheme rdf:resource="#jad-keywords"/>
</skos:Concept>

`;

    for (const keyword of concepts) {
      xml += `<skos:Concept rdf:about="#${keyword.jad_id}">
    <skos:prefLabel xml:lang="en">${escapeSpecialCharacters(keyword.name)}</skos:prefLabel>
    <skos:definition xml:lang="en">${escapeSpecialCharacters(keyword.description)}</skos:definition>
    <skos:broader rdf:resource="#${groupId}"/>
    <skos:inScheme rdf:resource="#jad-keywords"/>
</skos:Concept>

`;
    }
  }

  xml += `</rdf:RDF>\n`;

  return xml;
}

export function makeKeywordsTaxonomy(keywords: Keyword[]) {
  const taxonomy = new Map<string, Keyword[]>();

  for (const keyword of keywords) {
    if (!taxonomy.has(keyword.part_of)) {
      taxonomy.set(keyword.part_of, []);
    }

    taxonomy.get(keyword.part_of)!.push(keyword);
  }

  let xml = `<taxonomy xml:id="jad-keywords">\n`;

  for (const [group, concepts] of taxonomy) {
    const groupId = group.toLowerCase().replace(/\s+/g, "-");

    xml += `  <category xml:id="${groupId}">\n`;
    xml += `    <catDesc>${escapeSpecialCharacters(group)}</catDesc>\n`;

    for (const keyword of concepts) {
      xml += `    <category xml:id="${keyword.jad_id}">\n`;
      xml += `      <catDesc>${escapeSpecialCharacters(keyword.name)}</catDesc>\n`;

      if (keyword.description) {
        xml += `      <desc>${escapeSpecialCharacters(keyword.description)}</desc>\n`;
      }

      xml += `    </category>\n`;
    }

    xml += `  </category>\n`;
  }

  xml += `</taxonomy>`;

  return xml;
}
