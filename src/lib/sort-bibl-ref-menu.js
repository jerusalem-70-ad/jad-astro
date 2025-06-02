// helper function to sort biblical references menu according to Nova Vulgata Book Order
// Import the Nova Vulgata order from your existing file
import { NOVA_VULGATA_ORDER } from "../../scripts/sort-bibl-ref.js";

// Create a custom comparator for biblical references
export const biblicalComparator = (a, b) => {
  // Extract the book name from the hierarchical menu item
  // The item structure is either a string or an object with 'name' property
  const getBookName = (item) => {
    const value = item?.name || item;

    // Handle hierarchical format: "Book > Chapter > Verse"
    // Extract just the book name (first part before " > ")
    const bookPart = value.split(" > ")[0];

    // Clean up any extra whitespace
    return bookPart.trim();
  };

  const bookA = getBookName(a);
  const bookB = getBookName(b);

  // Get the biblical order for each book
  const orderA = NOVA_VULGATA_ORDER[bookA];
  const orderB = NOVA_VULGATA_ORDER[bookB];

  // If both books are found in our order mapping, sort by biblical order
  if (orderA !== undefined && orderB !== undefined) {
    return orderA - orderB;
  }

  // If only one book is found, put the unknown one at the end
  if (orderA !== undefined && orderB === undefined) {
    return -1; // A comes first
  }
  if (orderA === undefined && orderB !== undefined) {
    return 1; // B comes first
  }

  // If neither book is found, fall back to alphabetical sorting
  return bookA.localeCompare(bookB);
};
