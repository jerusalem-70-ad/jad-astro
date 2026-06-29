import type { Passage } from "@/types";
import normalizeText from "./normalize-text";
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
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml"
	schematypens="http://purl.oclc.org/dsdl/schematron"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:id="${p.jad_id}">
  <teiHeader>
      <fileDesc>
         <titleStmt>
            <title>Passage: ${titleAuthor}</title>
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
            <edition>Born digital edition according to the TEI P5 guidelines.</edition>
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
            ${makeIndex(p.work)}
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
       <div type="original_spelling">
      <head>
         <title>${title}</title>
         <rs type="jad_id" ref="#${p.jad_id}">${p.jad_id}</rs>
         <bibl>
            <title ref="#${p.work[0]?.jad_id}">${title}</title>
            <author ref="#${p.work[0]?.author[0]?.jad_id}">${p.work[0]?.author[0]?.name}</author>
            <biblScope>${position}</biblScope>
         </bibl>            
      </head>
      <p>${p.text_paragraph}</p>
   </div>
   <div type="normalized_spelling">
     <p>${normalizeText(p.text_paragraph ?? "")}</p>
   </div>
   </body>
  </text>
</TEI>
    `;
}
