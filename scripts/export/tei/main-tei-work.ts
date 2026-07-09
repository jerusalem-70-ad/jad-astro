import type { WorkFull, Passage } from "@/types";

import {
  makeMsIndex,
  makeBiblRefIndex,
  makeLiturgRefIndex,
  makeTextList,
  makeBiblEdition,
} from "./partials/makeIndex";
import { makePassageList } from "./partials/makePassageList";
import passagesJson from "@/content/data/passages.json";
const passages = passagesJson as Passage[];

export default function mainTei(w: WorkFull) {
  const author = w.author.length > 0 ? w.author[0].name : ``;
  const title = w.title ?? "";
  let titleAuthor = title;

  if (author && title) {
    titleAuthor = `${author}: ${title}`;
  }
  const setIdPass = new Set(
    w.related__passages.flatMap((position) =>
      position.passages.map((p) => p.jad_id),
    ),
  );
  const relatedPassages = passages.filter((p) => setIdPass.has(p.jad_id));
  const liturgicalRefs = relatedPassages.flatMap(
    (p) => p.liturgical_references,
  );
  const biblicalRefs = relatedPassages.flatMap((p) => p.biblical_references);
  const allNodes = relatedPassages.flatMap(
    (p) => p.transmission_graph.graph.nodes,
  );

  let editionStmt = "";
  if (w.edition) editionStmt += `Edition of ${titleAuthor}: ${w.edition}. `;
  if (w.link_digital_editions)
    editionStmt += `Link to online edition: <ptr target="${w.link_digital_editions}"/>.`;
  if (w.other_editions) editionStmt += `Other editions: ${w.other_editions}.`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml"
	schematypens="http://purl.oclc.org/dsdl/schematron"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:id="${w.jad_id}">
  <teiHeader>
      <fileDesc>
         <titleStmt>
            <title>Passages from the work ${titleAuthor} collected within the Porject 'Medieval Reception of the Roman Conquest of Jerusalem'</title>
         <principal>
            <persName>Alexander Marx</persName>
            <name type="org">Austrian Academy of Sciences</name>
         </principal>
         <funder>
            <name>FWF - Der Wissenschaftsfonds</name>
            <address>
               <street>Sensengasse 1</street>
               <postCode>1090 Vienna</postCode>
               <placeName>
                  <country>A</country>
                  <settlement>Vienna</settlement>
               </placeName>
            </address>
         </funder>
         </titleStmt>
         <editionStmt>
            <edition>
            The passages were either transcribed during in situ manuscript research or 
               reproduced from printed and electronic sources. The source of each passage is 
               documented in the &lt;sourceDesc&gt;. The accompanying metadata—including keywords, 
               biblical and liturgical references, transmission history (identifying source and 
               derivative passages), clusters, manuscript descriptions, and authority data for 
               works, authors, and places (including GND and GeoNames identifiers)—was compiled 
               by the principal investigator, Alexander Marx.
               ${editionStmt}.
            </edition>
            <respStmt>
               <resp>TEI-P5 encodng performed with template script</resp>
               <name type="person">Ivana Dobcheva</name>
               <name type="org">Austrian Center for Digital Humanities</name>
               <name type="org">Austrian Academy of Sciences</name>
            </respStmt>
         </editionStmt>
         <publicationStmt>
            <p>Publication Information</p>
         </publicationStmt>
         <sourceDesc>         
        ${makeMsIndex(w.manuscripts)}
        ${makeBiblEdition([w])}
        </sourceDesc>
      </fileDesc>
     <encodingDesc>
        <projectDesc>
           <p>Passages are collected, transcribed, and excerpted from manuscripts and electronic and printed sources 
           by the principal investigator, Alexander Marx, as part of the project Medieval Reception 
           of the Roman Conquest of Jerusalem. The project assembles, organises, and preserves 
           textual evidence illustrating how medieval authors understood and reinterpreted the 
           events of 70 CE. The ACDH team develops the data model, manages the dataset, and oversees 
           the electronic publication and long-term archiving. The project is funded by the FWF and 
           aims to provide a consistent, searchable, and accessible corpus of medieval interpretations 
           of the Roman Conquest of Jerusalem.</p>
        </projectDesc>        
     </encodingDesc>
  </teiHeader>
  <text>
    <body>
       
      <head>
         <title>${titleAuthor}</title>
         <bibl>
            <title>${title}</title>
            <author ref="#${w.author[0]?.jad_id}">${w.author[0]?.name}</author>
         </bibl>            
      </head>     
      <list type="passages">
      <head>Passages from this work:</head>
      ${relatedPassages.map((p) => makePassageList(p)).join("")}
      </list>
     
   </body>
  </text>
  <standOff>
  ${makeLiturgRefIndex(liturgicalRefs)}
  ${makeBiblRefIndex(biblicalRefs)}
  ${makeTextList(allNodes)}
  </standOff>
</TEI>
    `;
}
