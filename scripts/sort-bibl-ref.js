// Nova Vulgata book order mapping
export const NOVA_VULGATA_ORDER = {
  // Old Testament
  Gen: 1,
  Genesis: 1,
  Ex: 2,
  Exodus: 2,
  Lev: 3,
  Leviticus: 3,
  Num: 4,
  Numeri: 4,
  Deut: 5,
  Deuteronomium: 5,
  Jos: 6,
  Josue: 6,
  Judg: 7,
  Judges: 7,
  Ruth: 8,
  Sam: 9,
  "1Sam": 9,
  "2Sam": 10,
  "1 Sam": 9,
  "2 Sam": 10,
  Reg: 11,
  "1Reg": 11,
  "2Reg": 12,
  "3Reg": 13,
  "4Reg": 14,
  "1 Reg": 11,
  "2 Reg": 12,
  "3 Reg": 13,
  "4 Reg": 14,
  Par: 15,
  "1Par": 15,
  "2Par": 16,
  "1 Par": 15,
  "2 Par": 16,
  Esr: 17,
  Ezra: 17,
  Neh: 18,
  Nehemia: 18,
  Tob: 19,
  Tobias: 19,
  Jdt: 20,
  Judith: 20,
  Jud: 20,
  Esth: 21,
  Esther: 21,
  Job: 22,
  Ps: 23,
  Psalms: 23,
  Prov: 24,
  Proverbia: 24,
  Eccl: 25,
  Ecclesiastes: 25,
  Koh: 25, // Adding Koh (Kohelet) as alias
  Cant: 26,
  Cantica: 26,
  Sap: 27,
  Sapientia: 27,
  Sir: 28,
  Sirach: 28,
  Is: 29,
  Isaia: 29,
  Jer: 30,
  Jeremia: 30,
  Lam: 31,
  Lamentationes: 31,
  Bar: 32,
  Baruch: 32,
  Ez: 33,
  Ezechiel: 33,
  Dan: 34,
  Daniel: 34,
  Os: 35,
  Osee: 35,
  Hos: 35,
  Joel: 36,
  Am: 37,
  Amos: 37,
  Abd: 38,
  Abdiam: 38,
  Abdias: 38,
  Jon: 39,
  Jonas: 39,
  Mich: 40,
  Michea: 40,
  Nah: 41,
  Nahum: 41,
  Naum: 41,
  Hab: 42,
  Habacuc: 42,
  Soph: 43,
  Sophonia: 43,
  Agg: 44,
  Aggeus: 44,
  Zach: 45,
  Zacharia: 45,
  Mal: 46,
  Malachia: 46,
  Mac: 47,
  "1Mac": 47,
  "2Mac": 48,
  Macc: 47,
  "1Macc": 47,
  "2Macc": 48, // Alternative spellings
  "1 Mac": 47,
  "2 Mac": 48,
  "1 Macc": 47,
  "2 Macc": 48, // With spaces

  // New Testament
  Mt: 49,
  Matthew: 49,
  Mc: 50,
  Mark: 50,
  Lc: 51,
  Luke: 51,
  Lk: 51,
  Jn: 52,
  John: 52,
  Joh: 52,
  Act: 53,
  Acts: 53,
  Rom: 54,
  Romans: 54,
  Cor: 55,
  "1Cor": 55,
  "2Cor": 56,
  "1 Cor": 55,
  "2 Cor": 56,
  Gal: 57,
  Galatians: 57,
  Eph: 58,
  Ephesians: 58,
  Phil: 59,
  Philippians: 59,
  Col: 60,
  Colossians: 60,
  Thess: 61,
  "1Thess": 61,
  "2Thess": 62,
  Thes: 61,
  "1Thes": 61,
  "2Thes": 62, // Alternative spellings
  "1 Thess": 61,
  "2 Thess": 62,
  "1 Thes": 61,
  "2 Thes": 62, // With spaces
  Tim: 63,
  "1Tim": 63,
  "2Tim": 64,
  "1 Tim": 63,
  "2 Tim": 64,
  Tit: 65,
  Titus: 65,
  Phlm: 66,
  Philemon: 66,
  Heb: 67,
  Hebrews: 67,
  Hebr: 67, // Adding Hebr as alias
  Jas: 68,
  James: 68,
  Pet: 69,
  "1Pet": 69,
  "2Pet": 70,
  "1 Pet": 69,
  "2 Pet": 70,
  Jn2: 71,
  "1Jn": 71,
  "2Jn": 72,
  "3Jn": 73,
  "1 Jn": 71,
  "2 Jn": 72,
  "3 Jn": 73, // With spaces
  Jude: 74,
  Apoc: 75,
  Apocalypse: 75,
  Rev: 75,
};
// function to sort passages based on their position_in_work
export function calculateSortPosition(positionInWork) {
  if (!positionInWork) return 999999; // Put undefined positions at the end

  const position = positionInWork.trim();

  // Pattern 1: Biblical books (e.g., "Amos, B2")
  // handle optional period and optional comma/B prefix
  const biblicalMatch = position.match(/^([A-Za-z0-9]+)\.?,?\s*B?(\d+)$/);
  if (biblicalMatch) {
    const [, bookName, bookNumber] = biblicalMatch;
    const biblicalOrder = NOVA_VULGATA_ORDER[bookName];
    if (biblicalOrder) {
      return biblicalOrder * 10 + parseInt(bookNumber, 10);
    }
  }

  // Pattern 2: Book and Chapter (e.g., "B3, Ch63")
  const bookChapterMatch = position.match(/^B(\d+),?\s*Ch(\d+)$/);
  if (bookChapterMatch) {
    const [, bookNum, chapterNum] = bookChapterMatch;
    // Book/Chapter: 10,000+ range
    // This gives us room for 999 books with 9999 chapters each
    return 10000 + parseInt(bookNum, 10) * 10000 + parseInt(chapterNum, 10);
  }

  // Pattern 3: Sermons (e.g., "Sermo 2")
  const sermonMatch = position.match(/^Sermo\s+(\d+)/);
  if (sermonMatch) {
    const [, sermonNum] = sermonMatch;
    // Sermons: 100,000+ range
    return 100000 + parseInt(sermonNum, 10);
  }

  // Pattern 4: Praefatio/Prefatio
  if (position.startsWith("Praefatio") || position.startsWith("Prefatio")) {
    return 1;
  }

  // Fallback: Unknown patterns go to 900,000+ range
  // Try to extract any number for basic sorting
  const numberMatch = position.match(/(\d+)/);
  if (numberMatch) {
    return 900000 + parseInt(numberMatch[1], 10);
  }

  // If no number found, sort alphabetically by converting to char codes
  return 950000 + position.charCodeAt(0);
}

// Extracts the book abbreviation from a biblical reference

function extractBookAbbreviation(referenceValue) {
  if (referenceValue) {
    const cleanRef = referenceValue.trim();

    // Handle numbered books with spaces first (4 Reg, 1 Macc, etc.)
    const numberedWithSpaceMatch = cleanRef.match(/^(\d+\s+[A-Za-z]+)/);
    if (numberedWithSpaceMatch) {
      return numberedWithSpaceMatch[0];
    }
    // Handle numbered books without spaces (1Cor, 2Sam, etc.)
    const numberedBookMatch = cleanRef.match(/^(\d[A-Za-z]+)/);
    if (numberedBookMatch) {
      return numberedBookMatch[0];
    }

    // Handle special cases that don't follow the typical pattern
    const specialCases = ["Joel", "Acts", "Job", "Ruth", "Jude", "Hebr", "Koh"];
    for (const special of specialCases) {
      if (cleanRef.startsWith(special)) {
        return special;
      }
    }

    // Default case: split on first period, comma, or space
    const parts = cleanRef.split(/[\s.,]/);
    return parts[0];
  } else {
    console.warn("Reference value is empty or undefined");
    return null;
  }
}

function parseChapterVerse(referenceValue, bookAbbrev) {
  const chapterVerse = referenceValue.substring(bookAbbrev.length).trim();
  const cleaned = chapterVerse.replace(/^[.,\s]+/, "");

  const chapterVerseMatch = cleaned.match(/^(\d+)(?:[.,](\d+(?:-\d+)?))?/);

  if (chapterVerseMatch) {
    const chapter = parseInt(chapterVerseMatch[1]);
    const verse = chapterVerseMatch[2] ? chapterVerseMatch[2] : null;
    return { chapter, verse };
  }

  return { chapter: null, verse: null };
}

export function generateBiblicalSortKey(referenceValue) {
  const bookAbbrev = extractBookAbbreviation(referenceValue);
  const bookOrder = NOVA_VULGATA_ORDER[bookAbbrev];

  if (bookOrder === undefined) {
    console.warn(
      `Unknown book abbreviation: ${bookAbbrev} in reference: ${referenceValue}`
    );
    return 999999999; // Put unknown references at the end
  }

  const { chapter, verse } = parseChapterVerse(referenceValue, bookAbbrev);

  // Create a sort key: bookOrder * 1000000 + chapter * 1000 + verse
  // This ensures proper ordering: book first, then chapter, then verse
  const chapterNum = chapter || 0;
  const verseNum = verse ? parseInt(verse.split("-")[0]) : 0; // Handle verse ranges

  return bookOrder * 1000000 + chapterNum * 1000 + verseNum;
}
