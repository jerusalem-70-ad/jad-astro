export default function normalizeText(text: string) {
  const normalizeText = text
    .toLowerCase()
    .replace(/ae/g, "e")
    .replace(/oe/g, "e")
    .replace(/j/g, "i")
    .replace(/y/g, "i")
    .replace(/v/g, "u")
    .replace(/(?<=[aeiouy])u(?=[aeiouy])/g, "v") // replace u-> v surrounded by vowels
    .replace(/\bu(?=[aeiou])/g, "v") // restore consonantal v at word start
    .replace(/\u00A0/g, " ") // replace non-breaking space
    .replace(/\s+/g, " ") // collapse all whitespace
    .trim(); // remove leading/trailing whitespace

  return normalizeText;
}
