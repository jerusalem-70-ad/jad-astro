export function addItalics(text: string) {
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
    const button = (event.target as Element).closest(".show-more-btn");
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

// navigation function
// dropdown menu in navbar

function initDropdowns() {
  const dropdowns = document.querySelectorAll<HTMLElement>("[data-dropdown]");

  function closeDropdown(dropdown: HTMLElement) {
    const button = dropdown.querySelector<HTMLButtonElement>(
      "[data-dropdown-button]",
    );
    const menu = dropdown.querySelector<HTMLElement>("[data-dropdown-menu]");
    const icon = dropdown.querySelector<HTMLElement>("[data-dropdown-icon]");

    if (!button || !menu) return;

    button.setAttribute("aria-expanded", "false");
    menu.classList.add("hidden");
    icon?.classList.remove("rotate-180");
  }

  function openDropdown(dropdown: HTMLElement) {
    const button = dropdown.querySelector<HTMLButtonElement>(
      "[data-dropdown-button]",
    );
    const menu = dropdown.querySelector<HTMLElement>("[data-dropdown-menu]");
    const icon = dropdown.querySelector<HTMLElement>("[data-dropdown-icon]");

    if (!button || !menu) return;

    dropdowns.forEach((other) => {
      if (other !== dropdown) {
        closeDropdown(other);
      }
    });

    button.setAttribute("aria-expanded", "true");
    menu.classList.remove("hidden");
    icon?.classList.add("rotate-180");
  }

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector<HTMLButtonElement>(
      "[data-dropdown-button]",
    );

    if (!button) return;

    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeDropdown(dropdown);
      } else {
        openDropdown(dropdown);
      }
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDropdown(dropdown);
        button.focus();
      }
    });

    dropdown.addEventListener("focusout", (event) => {
      const nextFocusedElement = event.relatedTarget;

      if (
        nextFocusedElement instanceof Node &&
        dropdown.contains(nextFocusedElement)
      ) {
        return;
      }

      closeDropdown(dropdown);
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Node)) return;

    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(target)) {
        closeDropdown(dropdown);
      }
    });
  });
}

export { initDropdowns };

// show dialog with bibliography in passage detail view page
export function setupBibliographyDialog() {
  const infoButton = document.getElementById("bibliography-info");
  const dialog = document.getElementById("bibliography-dialog");
  const closeButton = document.getElementById("bibliography-close");

  if (
    infoButton instanceof HTMLButtonElement &&
    dialog instanceof HTMLDialogElement &&
    closeButton instanceof HTMLButtonElement
  ) {
    if (infoButton.dataset.dialogInitialized) return;

    infoButton.dataset.dialogInitialized = "true";

    infoButton.addEventListener("click", () => dialog.showModal());

    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }
}
