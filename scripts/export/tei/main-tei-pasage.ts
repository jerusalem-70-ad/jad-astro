import type { Passage } from "@/types";
import normalizeText from "./normalize-text";
import {
  listKeywords,
  listDerivativeWorks,
  listSourceWorks,
  listClusters,
  listBiblicalRefs,
  listLiturgicalBiblicalRefs,
} from "./partials/metadata";
import {
  makeMsIndex,
  makeBiblRefIndex,
  makeLiturgRefIndex,
  makeListPerson,
  makeCluterIndex,
  makePlaceIndex,
  makeTextList,
  makeBiblEdition,
} from "./partials/makeIndex";
import { escapeSpecialCharacters } from "./partials/helpers";

export default function mainTei(p: Passage) {
  const author = p.work[0]?.author.length > 0 ? p.work[0]?.author[0].name : ``;
  const title = p.work[0]?.title ?? "";
  const position = p.position_in_work ?? "";
  let titleAuthor = title;

  if (author && title) {
    titleAuthor = `${author}: ${title}`;
  }

  if (position && titleAuthor) {
    titleAuthor += ` (${position})`;
  }
  let editionStmt = p.occurrence_found_in.length
    ? `Passage found in ${p.occurrence_found_in[0].value}. `
    : "";
  if (p.text_taken_from.length)
    editionStmt += `Text taken from ${p.text_taken_from[0].value}. `;
  if (p.edition_link)
    editionStmt += `Link to online edition: <ptr target="${p.edition_link}"/>.`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml"
	schematypens="http://purl.oclc.org/dsdl/schematron"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:id="${p.jad_id}">
  <teiHeader>
      <fileDesc>
         <titleStmt>
            <title type="main">Passage: ${titleAuthor}</title>
            <title type="sub">Project Medieval Reception of the Roman Conquest of Jerusalem</title>
          <principal ref="https://d-nb.info/gnd/1360631461">
               Alexander Marx
            </principal>
         <funder ref="https://d-nb.info/gnd/2054142-9">
            <name>FWF - Der Wissenschaftsfonds</name>
         </funder>
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
         ${p.mss_occurrences.length ? "<listWit>" : ""}         
        ${makeMsIndex(p.mss_occurrences)}
         ${p.mss_occurrences.length ? "</listWit>" : ""}   
        ${makeBiblEdition(p.work)}
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
         <title>${title}</title>
         <rs type="jad_id" ref="#${p.jad_id}">${p.jad_id}</rs>
         <bibl>
            <title ref="#${p.work[0]?.jad_id}">${title}</title>
            <author ref="#${p.work[0]?.author[0]?.jad_id}">${p.work[0]?.author[0]?.name}</author>
            <biblScope>${position}</biblScope>
         </bibl>            
      </head>     
      <div type="original_spelling">
         <div>
            <head>Short text:</head>
            <p>${p.passage}</p>
         </div>
         <div>
            <head>Full text:</head>
            <p>${escapeSpecialCharacters(p.text_paragraph ?? "")}</p>
         </div>
      </div>
      
      <div type="normalized_spelling">
      <p>${normalizeText(p.text_paragraph ?? "")}</p>
      </div>
      <div type="metadata">
         ${listKeywords(p.keywords)}
         ${listSourceWorks(p.transmission_graph)}
         ${listDerivativeWorks(p.transmission_graph)}
         ${listClusters(p.part_of_cluster)}
         ${listBiblicalRefs(p.biblical_references)}
         ${listLiturgicalBiblicalRefs(p.liturgical_references)}
      </div>
   </body>
  </text>
  <standOff>
  ${makePlaceIndex(p.work[0], p.mss_occurrences, p.transmission_graph.graph.nodes)}
  ${makeListPerson(p.transmission_graph.graph.nodes)}
  ${makeLiturgRefIndex(p.liturgical_references)}
  ${makeBiblRefIndex(p.biblical_references)}       
  ${makeTextList(p.transmission_graph.graph.nodes)}
  ${makeCluterIndex(p.part_of_cluster)}
  </standOff>
</TEI>
    `;
}
