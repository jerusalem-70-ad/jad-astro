import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
const loadJSON = (file) =>
  JSON.parse(
    readFileSync(join(process.cwd(), "src/content/row", file), "utf8")
  );
const places = Object.values(loadJSON("places.json"));

export function enrichLibraries(librariesArray, libraries) {
  return librariesArray.map((lib) => {
    // Find matching library in libraries.json
    const library = libraries.find((l) => l.id === lib.id) || {};
    return {
      id: lib.id,
      name: lib.value,
      full_name: library.full_name ?? "",
      place: enrichPlaces(library.place, places) ?? "",
      jad_id: library.jad_id ?? "",
      url: library.url ?? "",
    };
  });
}

export function addPrevNextToItems(
  item,
  idField = "jad_id",
  labelField = "view_label"
) {
  // Sort item by their keys or any specific field (if needed)
  const sorteditem = [...item].sort((a, b) => a[idField] - b[idField]);

  // Loop through the sorted array and add 'prev' and 'next' properties
  for (let i = 0; i < sorteditem.length; i++) {
    const prevIndex = (i - 1 + sorteditem.length) % sorteditem.length; // Wrap around to the last item
    const nextIndex = (i + 1) % sorteditem.length; // Wrap around to the first item

    // Get the previous and next items
    const prevItem = sorteditem[prevIndex];
    const nextItem = sorteditem[nextIndex];

    // Add 'prev' and 'next' properties to the current item
    sorteditem[i]["prev"] = {
      id: prevItem[idField],
      label: prevItem[labelField] || prevItem[idField], // Fallback to id if label is not available
    };
    sorteditem[i]["next"] = {
      id: nextItem[idField],
      label: nextItem[labelField] || nextItem[idField], // Fallback to id if label is not available
    };
  }

  return sorteditem;
}

export function enrichDates(dateArray, dates) {
  return dateArray.map((date) => {
    // Find matching date in dates.json
    const dateRange = dates.find((d) => d.id === date.id);

    if (!dateRange) {
      // Return default structure if no match is found
      return {
        id: date.id,
        view_label: date.view_label,
        range: "",
        not_before: "",
        not_after: "",
      };
    }

    return {
      id: date.id,
      value: date.value,
      range: `${dateRange.not_before || 0}-${dateRange.not_after || 1600}`,
      not_before: Number(dateRange.not_before) || 70,
      not_after: Number(dateRange.not_after) || 1600,
      century: [
        ...new Set([
          getCentury(dateRange.not_before || ""),
          getCentury(dateRange.not_after || ""),
        ]),
      ],
    };
  });
}

// Helper function to calculate the century of not_before not_after dates

export function getCentury(year) {
  if (!year) return "N/A"; // Handle null or undefined dates

  const century = Math.ceil((parseInt(year) + 1) / 100);

  // Add correct ordinal suffix
  const getSuffix = (num) => {
    if (num >= 11 && num <= 13) return "th";
    const lastDigit = num % 10;
    switch (lastDigit) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${century}${getSuffix(century)} cen.`;
}

// helper function to get variant names from lobid API

export async function enrichAuthorsWithVariants() {
  // Create a function to fetch name variants from lobid API
  const fetchNameVariants = async (gndUrl) => {
    try {
      if (!gndUrl) {
        console.warn("No GND URL provided");
        return [];
      }

      // Extract GND ID and validate format
      const gndId = gndUrl
        .split("/")
        .pop()
        ?.replace(/[^0-9X-]/g, "");
      if (!gndId) {
        console.warn(`Invalid GND URL format: ${gndUrl}`);
        return [];
      }

      const url = `https://lobid.org/gnd/${gndId}.json`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "JAD-Project/1.0; ivana.dob@gmail.com",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          `No data returned for GND ID: ${gndId} (status: ${response.status})`
        );
        return [];
      }

      const lobidData = await response.json();

      // Handle array or string variant names
      const variants = Array.isArray(lobidData.variantName)
        ? lobidData.variantName
        : [lobidData.variantName].filter(Boolean);

      return variants;
    } catch (error) {
      console.error(`Error fetching name variants for ${gndUrl}:`, error);
      return [];
    }
  };

  // Enrich authors with name variants
  const enrichedAuthors = await Promise.all(
    authors.map(async (author) => {
      const nameVariants = await fetchNameVariants(author.gnd_url);
      return {
        ...author,
        nameVariants,
      };
    })
  );

  return enrichedAuthors;
}

// helpers function to normalize text
export function normalizeText(text) {
  if (!text) {
    return text;
  } else {
    return text
      .replace(/\n/g, " \n ") // keep newline, but ensure a space after
      .replace(/\t+/g, " ") // replace tabs (single or multiple) with one space
      .replace(/ +/g, " "); // collapse multiple spaces, just in case
  }
}

export function enrichPlaces(placeArray, places) {
  return placeArray.map((place) => {
    // Find matching place in places.json
    const place_geo = places.find((p) => p.id === place.id) || {};
    return {
      id: place.id,
      value: place.value,
      geonames_url: place_geo.geonames_url ?? "",
      jad_id: place_geo.jad_id ?? "",
      lat: place_geo.lat ?? "",
      long: place_geo.long ?? "",
    };
  });
}
