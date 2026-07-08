import type { Passage } from "@/types";
import {
  listKeywords,
  listDerivativeWorks,
  listSourceWorks,
  listClusters,
  listBiblicalRefs,
  listLiturgicalBiblicalRefs,
} from "./metadata";

export function makePassageList(p: Passage) {
  const keywords = p.keywords.flatMap((k) => k.subkeywords);
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

  if (p.text_paragraph) {
    xml += `<p>${p.text_paragraph}</p>\n`;
  }

  if (keywords.length) {
    xml += ` <list type="keywords">
                  <head>Keywords</head>\n`;
    for (let k of keywords)
      xml += `<item>
                <ref type="keyword" target="#${k.jad_id}">${k.label}</ref>
            </item>\n`;
    xml += `</list>\n`;
  }
  xml += metadata;
  return (xml += `</item>\n`);
}
