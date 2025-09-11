export function addItalics(text) {
  if (!text) return text;

  // Regex to find text between *asterisks*
  const regex = /\*(.*?)\*/g;

  // Replace *text* with <i>text</i>
  return text.replace(regex, "<i>$1</i>");
}
