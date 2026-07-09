import type { Passage } from "@/types";
import {
  listKeywords,
  listDerivativeWorks,
  listSourceWorks,
  listClusters,
  listBiblicalRefs,
  listLiturgicalBiblicalRefs,
} from "./metadata";

//function to render the passages from one work as list
// text of the passage +
//incl. all info as metadata(keywods list, cluster ect.)
// list of mss with exact fol. location (with ref # to the msDesc in the parent Work's sourceDesc)
export function makePassageList(p: Passage) {
  const mss = p.mss_occurrences
    .map((ms) => {
      return `<item>
              <rs type="manuscript" ref="#${ms.jad_id}">${ms.manuscript}${ms.position_in_ms ? ` (${ms.position_in_ms})` : ""}</rs>
            </item>`;
    })
    .join(`\n`);
  const metadata = `
           ${listKeywords(p.keywords)}
           ${listSourceWorks(p.transmission_graph)}
           ${listDerivativeWorks(p.transmission_graph)}
           ${listClusters(p.part_of_cluster)}
           ${listBiblicalRefs(p.biblical_references)}
           ${listLiturgicalBiblicalRefs(p.liturgical_references)}
        `;
  let xml = `<item xml:id="${p.jad_id}">
                <label>${p.passage}</label>\n`;
  if (p.position_in_work) {
    xml += `    <note type="position">${p.position_in_work}</note>\n`;
  }

  if (p.mss_occurrences.length) {
    xml += `<list type="mss_occurrences">\n`;
    xml += mss;
    xml += `</list>\n`;
  }

  if (p.text_paragraph) {
    xml += `<p>${p.text_paragraph}</p>\n`;
  }
  xml += metadata;
  return (xml += `</item>\n`);
}
