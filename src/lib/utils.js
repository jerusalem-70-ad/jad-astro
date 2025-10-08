export function addItalics(text) {
  if (!text) return text;

  // Regex to find text between *asterisks*
  const regex = /\*(.*?)\*/g;

  // Replace *text* with <i>text</i>
  return text.replace(regex, "<i>$1</i>");
}

/**
 * Initialize event delegation for show more/less buttons
 */
export function initShowMoreButtons() {
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("show-more-btn")) {
      event.preventDefault();

      const button = event.target;
      const paragraph = button.previousElementSibling;

      if (!paragraph) {
        console.error("Could not find paragraph element");
        return;
      }

      paragraph.classList.toggle("line-clamp-2");

      if (paragraph.classList.contains("line-clamp-2")) {
        button.textContent = "Show more";
      } else {
        button.textContent = "Show less";
      }
    }
  });
}
