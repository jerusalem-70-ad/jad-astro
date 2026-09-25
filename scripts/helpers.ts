type BibleReference = {
  value: string;
};

// hierarchical 3-level index for the typesense schema for biblical references
// level 0 for book (not any more using the bookMap above), lv 1 for chapter, and lv 2 for verse

export function processBibleReference(ref: BibleReference) {
  const specialCases = [
    "1 John",
    "2 John",
    "3 John",
    "Joel",
    "Acts",
    "Job",
    "Osee",
    "Amos",
    "Ruth",
    "John",
  ];

  let bookAbbrev: string;
  let chapterVerse: string | undefined;

  const specialCase = specialCases.find((book) => ref.value.startsWith(book));

  if (specialCase) {
    bookAbbrev = specialCase;
    chapterVerse = ref.value.substring(bookAbbrev.length).trim();
  } else {
    [bookAbbrev, chapterVerse] = ref.value.split(".");
  }

  const book = bookAbbrev.trim();

  let chapter: string | undefined;
  let verse: string | undefined;

  if (chapterVerse?.includes(",")) {
    [chapter, verse] = chapterVerse.split(",");
  } else {
    chapter = chapterVerse;
    verse = "";
  }

  const chapterTrimmed = chapter?.trim() ?? "";
  const verseTrimmed = verse?.trim() ?? "";
  const chapterNum = chapterTrimmed.padStart(3, "0");

  return {
    lvl0: book,
    lvl1: `${book} > ${chapterNum}|${chapterTrimmed}`,
    lvl2: `${book} > ${chapterTrimmed} > ${verseTrimmed}`,
  };
}
