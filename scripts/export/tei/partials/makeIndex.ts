import type { Work } from "@/types";
import type { Passage } from "@/types";
import manuscripts from "@/content/data/manuscripts.json";
import { escapeSpecialCharacters, formatTeiYear } from "./helpers";

export function makeIndex(work: Work) {
  const authors = work.author.map((a) => {
    return `<person>`;
  });
}

// for the sourceDesc
export function makeMsIndex(mss: Passage["mss_occurrences"]) {
  let xml = "<listWit>";
  for (let ms of mss) {
    const manuscript = manuscripts.find(
      (manuscript) => manuscript.jad_id === ms.manuscript_jad_id,
    );
    const date = manuscript?.date_written[0];
    xml += `
        <witness>
            <msDesc>
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

// collect biblical refs in sourceDesc listBibl
export function makeBiblRefIndex(biblrefs: Passage["biblical_references"]) {
  let xml = '<listBibl type="biblicalRefs">';
  for (let ref of biblrefs)
    xml += `<bibl key="${ref.jad_id}">
                  <title>${ref.value}</title>
                  ${ref.nova_vulgata_url ? `<ptr target="${ref.nova_vulgata_url}"/>` : ""}
                  <quote>${ref.text}</quote>
               </bibl>`;
  return (xml += `</listBibl>`);
}

// collect liturgical refs in sourceDesc listBibl
export function makeLiturgRefIndex(refs: Passage["liturgical_references"]) {
  let xml = "<listEvent>";
  for (let ref of refs)
    xml += `<event key="${ref.jad_id}">
                  <label>${ref.value}</label>                 
                  <desc>${ref.description || ""}</desc>
               </event>`;
  return (xml += `</listEvent>`);
}

// collect sources for the passage

export function makeListSources(sources: Passage["source_passage"]) {
  if (!sources) return;
  else {
    let xml = '<listBibl type="sources">';
    for (let source of sources)
      xml += `
            <bibl>
                  <author>${source.author}</author>
                  <title>${source.title}</title>
                  <ptr target="${source.jad_id}"/>
               </bibl>
    `;
    return (xml += "</listBibl>");
  }
}

// collect derivatives

export function makeListDerivatives(
  derivatives: Passage["transmission_graph"],
) {
  const deriv = derivatives.graph.nodes.filter(
    (d) => d.nodeType === "descendant",
  );
  if (!deriv) return;
  else {
    let xml = '<listBibl type="derivative">';
    for (let der of deriv)
      xml += `
            <bibl>
                  <author>${der.author}</author>
                  <title>${der.work}</title>
                  <ptr target="${der.jad_id}"/>
               </bibl>
        `;
    return (xml += "</bibl>");
  }
}
