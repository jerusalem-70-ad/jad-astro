import type { WorkFull, Passage } from "@/types";
import {
  makeMsIndex,
  makeBiblRefIndex,
  makeLiturgRefIndex,
  makeListPerson,
  makeCluterIndex,
  makeWorkPlaceIndex,
  makeTextList,
  makeWorkEdition,
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
  // collect from related passages for the standOff indices:
  const relatedPassages = passages.filter((p) => setIdPass.has(p.jad_id));
  const liturgicalRefs = relatedPassages.flatMap(
    (p) => p.liturgical_references,
  );
  const biblicalRefs = relatedPassages.flatMap((p) => p.biblical_references);
  const allNodes = relatedPassages.flatMap(
    (p) => p.transmission_graph.graph.nodes,
  );
  const clusters = relatedPassages.flatMap((p) => p.part_of_cluster);

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
            <title type="main">Passages from the work ${titleAuthor}</title>
            <title type="sub">Project Medieval Reception of the Roman Conquest of Jerusalem</title>
            <principal ref="https://d-nb.info/gnd/1360631461">
               Alexander Marx
            </principal>
         <funder ref="https://d-nb.info/gnd/2054142-9">
            <name>FWF - Der Wissenschaftsfonds</name>
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
               <name type="person" ref="https://orcid.org/0000-0003-2388-1114">Ivana Dobcheva</name>
            </respStmt>
         </editionStmt>
          <publicationStmt>
            <publisher ref="gnd">Austrian Academy of Sciences</publisher>
            <pubPlace>Vienna</pubPlace>
            <date when="2026">2026</date>
            <availability>
               <licence target="https://creativecommons.org/licenses/by/4.0/deed.de">
                  <p>Sie dürfen: Teilen – das Material in jedwedem Format oder Medium vervielfältigen und weiterverbreiten Bearbeiten – das Material remixen, verändern und darauf aufbauen und zwar für beliebige Zwecke, sogar kommerziell.</p>
                  <p>Der Lizenzgeber kann diese Freiheiten nicht widerrufen solange Sie sich an die Lizenzbedingungen halten. Unter folgenden Bedingungen:</p>
                  <p>Namensnennung – Sie müssen angemessene Urheber- und Rechteangaben machen, einen Link zur Lizenz beifügen und angeben, ob Änderungen vorgenommen wurden. Diese Angaben dürfen in jeder angemessenen Art und Weise gemacht werden, allerdings nicht so, dass der Eindruck entsteht, der Lizenzgeber unterstütze gerade Sie oder Ihre Nutzung besonders. Keine weiteren Einschränkungen – Sie dürfen keine zusätzlichen Klauseln oder technische Verfahren einsetzen, die anderen rechtlich irgendetwas untersagen, was die Lizenz erlaubt.</p>
                  <p>Hinweise:</p>
                  <p>Sie müssen sich nicht an diese Lizenz halten hinsichtlich solcher Teile des Materials, die gemeinfrei sind, oder soweit Ihre Nutzungshandlungen durch Ausnahmen und Schranken des Urheberrechts gedeckt sind. Es werden keine Garantien gegeben und auch keine Gewähr geleistet. Die Lizenz verschafft Ihnen möglicherweise nicht alle Erlaubnisse, die Sie für die jeweilige Nutzung brauchen. Es können beispielsweise andere Rechte wie Persönlichkeits- und Datenschutzrechte zu beachten sein, die Ihre Nutzung des Materials entsprechend beschränken.</p>
               </licence>
            </availability>
         </publicationStmt>
         <sourceDesc>         
        ${makeMsIndex(w.manuscripts)}
        ${makeWorkEdition(w)}
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
  ${makeWorkPlaceIndex(
    relatedPassages.flatMap((r) => r.mss_occurrences),
    w.author,
    relatedPassages.flatMap((r) => r.transmission_graph.graph.nodes),
  )}
  ${makeListPerson(relatedPassages.flatMap((r) => r.transmission_graph.graph.nodes))}
  ${makeLiturgRefIndex(liturgicalRefs)}
  ${makeBiblRefIndex(biblicalRefs)}
  ${makeTextList(allNodes)}
  ${makeCluterIndex(clusters)}
  
  </standOff>
</TEI>
    `;
}
