import type { Work } from "@/types";
import type { Passage } from "@/types";
import manuscripts from "@/content/data/manuscripts.json";

export function makeIndex(work: Work) {
  const authors = work.author.map((a) => {
    return `<person>`;
  });
}

export function makeMsIndex(mss: Passage["mss_occurrences"]) {
  let xml = "";
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
                ${date ? `<origDate notBefore="${date.not_before}" notAfter="${date.not_after}">${date.value}</origDate>` : ""}
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
                <additional>
                    <surrogates>
                        ${manuscript?.catalog_url && `<ref type="catalogue" target="${manuscript.catalog_url}"></ref>`}
                        ${manuscript?.digi_url && `<ref type="catalogue" target="${manuscript.digi_url}"></ref>`}
                    </surrogates>
                </additional>
            </msDesc>
        </witness>
        `;
  }
}
