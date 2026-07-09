export function escapeSpecialCharacters(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// make the year 801 to 0801 for the tei notBefore
export function formatTeiYear(year: number | null | undefined): string {
  return year == null ? "" : year.toString().padStart(4, "0");
}
