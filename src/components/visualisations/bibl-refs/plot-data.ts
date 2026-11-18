//shared ts for preparing data for the bibl refs scatter charts, one with
// date on the y, the other with clusters (change the getY)
import {
  extractBookAbbreviation,
  parseChapterVerse,
} from "@/lib/search/utils.js";
import type { PassageForBiblRefs } from "@/types/index";

type YValue = string | number | undefined;
// getY(passage) => the y value for this passage (a year, or a cluster string)
export function buildPoints(
  passages: PassageForBiblRefs[],
  book: string,
  chapter: number,
  getY: (p: PassageForBiblRefs) => YValue,
) {
  const grouped = new Map();

  for (const p of passages) {
    const y = getY(p);
    for (const ref of p.biblRefs) {
      if (extractBookAbbreviation(ref) !== book) continue;
      const { chapter: ch, verse } = parseChapterVerse(ref, book);
      if (ch !== chapter || !verse) continue;

      const verseNum = parseInt(verse.split("-")[0]);
      const key = `${p.jad_id}|${verseNum}`;
      const entry = grouped.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        grouped.set(key, {
          value: [verseNum, y],
          jad_id: p.jad_id,
          verse,
          count: 1,
          title: p.workTitle,
          notBefore: p.date[0].notBefore,
          notAfter: p.date[0].notAfter,
          genre: p.genre,
          cluster: p.cluster?.[0],
        });
      }
    }
  }
  return [...grouped.values()];
}
