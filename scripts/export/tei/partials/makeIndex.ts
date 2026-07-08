import type { Author, Work } from "@/types";
import type { Passage } from "@/types";
import manuscripts from "@/content/data/manuscripts.json";
import authors from "@/content/data/authors.json";
import works from "@/content/data/works.json";
import { escapeSpecialCharacters, formatTeiYear } from "./helpers";

export function makeIndex(work: Work) {
  const authors = work.author.map((a) => {
    return `<person>`;
  });
}

// for the sourceDesc
export function makeMsIndex(mss: Passage["mss_occurrences"]) {
  if (!mss.length) return "";
  let xml = `<listWit>`;
  for (let ms of mss) {
    const manuscript = manuscripts.find(
      (manuscript) => manuscript.jad_id === ms.manuscript_jad_id,
    );
    const date = manuscript?.date_written[0];
    xml += `
        <witness>
            <msDesc xml:id="${manuscript?.jad_id}">
                <msIdentifier>
                    <settlement ref="#${ms.lib_place[0].jad_id}">${ms.lib_place[0].value}</settlement>
                    <repository>${manuscript?.library[0].full_name}</repository>
                    <idno>${manuscript?.idno}</idno>                                
                </msIdentifier>
                <head>
                ${date ? `<origDate notBefore="${formatTeiYear(date.not_before)}" notAfter="${formatTeiYear(date.not_after)}">${date.value}</origDate>` : ""}
                </head>
                ${
                  manuscript?.format
                    ? ` <physDesc>
                                <objectDesc>
                                    <supportDesc>
                                        <extent>${manuscript.format}</extent>
                                    </supportDesc>
                                </objectDesc>
                            </physDesc>`
                    : ""
                }
                 <msContents>
                        <p>Position of the passage: 
                            ${
                              ms.facsimile_position
                                ? `<ref facs="${ms.facsimile_position}">${ms.position_in_ms}</ref>`
                                : `${ms.position_in_ms}`
                            }
                        </p>
                     </msContents>
                <additional>
                    <surrogates>
                        ${manuscript?.catalog_url && `<ref type="catalogue" target="${escapeSpecialCharacters(manuscript.catalog_url)}"></ref>`}
                        ${manuscript?.digi_url && `<ref type="catalogue" target="${escapeSpecialCharacters(manuscript.digi_url)}"></ref>`}
                    </surrogates>
                </additional>
            </msDesc>
        </witness>
        `;
  }
  return (xml += `</listWit>`);
}

export function makeBiblEdition(work: Passage["work"]) {
  if (!work[0].edition) return "";
  let xml = `<bibl>${work[0].edition} ${work[0].link_digital_editions && `<ptr target="${work[0].link_digital_editions}"/>`}</bibl>`;
  return xml;
}

// collect biblical refs in standOff listBibl
export function makeBiblRefIndex(biblrefs: Passage["biblical_references"]) {
  if (!biblrefs.length) return "";
  let xml = '<listBibl type="biblicalRefs">';
  for (let ref of biblrefs)
    xml += `<bibl xml:id="${ref.jad_id}">
                  <title>${ref.value}</title>
                  ${ref.nova_vulgata_url ? `<ptr target="${ref.nova_vulgata_url}"/>` : ""}
                  <quote>${ref.text}</quote>
               </bibl>`;
  return (xml += `</listBibl>`);
}

// collect liturgical refs in standOff listEvent
export function makeLiturgRefIndex(refs: Passage["liturgical_references"]) {
  if (!refs.length) return "";
  let xml = "<listEvent>";
  for (let ref of refs)
    xml += `<event xml:id="${ref.jad_id}">
                  <label>${ref.value}</label>                 
                  <desc>${ref.description || ""}</desc>
               </event>`;
  return (xml += `</listEvent>`);
}

// collect related texts (sources and derivatives) for the passage

export function makeTextList(transmission: Passage["transmission_graph"]) {
  const texts = transmission.graph.nodes.filter((n) => n.nodeType != "current");
  if (!texts.length) return "";
  let xml = `<listBibl>
            <desc>Related passages - derivative and source.</desc>`;
  for (let text of texts) {
    const authorJad =
      authors.find((a) => a.name === text.author)?.jad_id || "unknown";
    const workJad =
      works.find((w) => w.title === text.work)?.jad_id || "unknown";
    xml += `
            <bibl xml:id="${text.jad_id}">
                  <author ref="#${authorJad}">${text.author}</author>
                  <title ref="#${workJad}">${text.work}</title>
               </bibl>
        `;
  }
  return (xml += "</listBibl>");
}

// list of clusters
export function makeCluterIndex(clusters: Passage["part_of_cluster"]) {
  if (!clusters.length) return "";
  let xml = '<list type="cluster">\n';
  for (let cluster of clusters)
    xml += `    <item xml:id="${cluster.jad_id}">
                    <label>${cluster.value}</label>
                    <desc>${cluster.description}</desc>
                </item>\n`;
  return (xml += "</list>");
}

// helper to get the authors mentioned in the transmission_graph
export function getMentionedAuthors(
  graph: Passage["transmission_graph"],
): Author[] {
  const mentionedNames = new Set(graph.graph.nodes.map((node) => node.author));

  return authors.filter((author) => mentionedNames.has(author.name));
}

// list of places
export function makePlaceIndex(
  work: Passage["work"],
  lib: Passage["mss_occurrences"],
  graph: Passage["transmission_graph"],
) {
  if (!work.length && !lib.length) return "";
  const places = new Map();
  // library
  for (let libr of lib) places.set(libr.lib_place[0].jad_id, libr.lib_place[0]);
  // places in passage's own work author
  const workPlace = work.flatMap((w) => w.author.flatMap((a) => a.place));
  for (let pl of workPlace) places.set(pl.jad_id, pl);

  // places from related passages/works/authors
  if (!graph) return "";
  for (const author of getMentionedAuthors(graph)) {
    for (const place of author.place) {
      places.set(place.jad_id, place);
    }
  }
  let xml = "<listPlace>\n";
  for (const place of places.values()) {
    xml += `<place xml:id="${place.jad_id}">
    <placeName>${place.value}</placeName>
    <location>
      <geo>${place.lat} ${place.long}</geo>
    </location>
    ${place.geonames_url ? `<ptr target="${place.geonames_url}"/>` : ""}
  </place>\n`;
  }
  return (xml += "</listPlace>");
}

// list of person
export function makeListPerson(graph: Passage["transmission_graph"]) {
  const people = new Map();
  for (const author of getMentionedAuthors(graph)) {
    people.set(author.jad_id, author);
  }

  let xml = "<listPerson>\n";
  for (const person of people.values()) {
    xml += `  <person xml:id="${person.jad_id}">\n`;
    xml += `    <name>\n`;
    xml += `      <persName>${person.name}</persName>\n`;

    if (person.occupation) {
      xml += `      <roleName>${person.occupation}</roleName>\n`;
    }

    xml += `    </name>\n`;

    if (person.place.length) {
      xml += `    <floruit>\n`;
      xml += `      <placeName ref="#${person.place[0].jad_id}">${person.place[0].value}</placeName>\n`;
      xml += `    </floruit>\n`;
    }

    if (person.rawDates[0]?.not_before) {
      xml += `    <birth>${person.rawDates[0].not_before}</birth>\n`;
    }

    if (person.rawDates[0]?.not_after) {
      xml += `    <death>${person.rawDates[0].not_after}</death>\n`;
    }

    if (person.gnd_url) {
      xml += `    <ptr target="${person.gnd_url}"/>\n`;
    }

    xml += `  </person>\n`;
  }

  return (xml += "</listPerson>");
}
