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
    const button = event.target.closest(".show-more-btn");
    if (!button) return;

    const article = button.closest("article");
    const paragraph = article?.querySelector("p.italic");
    if (!paragraph) return;

    const isCollapsed = paragraph.classList.contains("line-clamp-2");

    // Toggle state
    if (isCollapsed) {
      paragraph.classList.remove("line-clamp-2");
      button.textContent = "Show less";
    } else {
      paragraph.classList.add("line-clamp-2");
      button.textContent = "Show more";
    }
  });
}
