// custom function for get scrollable cells in tabulator
export function scrollableCellFormatter(cell) {
  const value = cell.getValue();
  if (!value) return "";

  return `<div style="max-height: 100px; overflow-y: auto; overflow-x: hidden">${value}</div>`;
}

// custom filter for tabulator to search in both name and alt_name fields
export function customNameFilter(headerValue, rowValue, rowData) {
  if (!headerValue) return true;

  const search = headerValue.toLowerCase();
  const nameMatch = rowData.aut_name?.toLowerCase().includes(search);
  const altNameMatch = rowData?.alt_name
    ? rowData.alt_name.toLowerCase().includes(search)
    : false;
  return nameMatch || altNameMatch;
}

// function for tabulator accessor  Ensures filtering and sorting dates correctly
export function dateAccessor(value) {
  if (!value || !Array.isArray(value)) return "";
  return value.map((dateObj) => dateObj.range || "").join(", ");
}

//  function for tabulator formatter - Formatting the displayed values
export function dateFormatter(cell) {
  const value = cell.getValue();
  if (!value || !Array.isArray(value)) {
    console.log("Returning 'not array'");
    return "not array";
  }

  const result = value
    .map((dateObj) => {
      return dateObj.value || "";
    })
    .join(" | ");
  return result;
}
export function dateRangeFilter(
  headerValue,
  rowValue,
  rowData,
  filterParams,
  accessor
) {
  // Allow all rows if the filter is empty or invalid
  if (
    !headerValue ||
    (!/^\d+$/.test(headerValue) &&
      !/^before \d+$/.test(headerValue) &&
      !/^after \d+$/.test(headerValue))
  ) {
    return true;
  }

  // Determine operator and filter year from input
  const operatorMatch = headerValue.match(/^(before|after)?\s?(\d+)$/);
  const operator = operatorMatch?.[1] || null;
  const filterYear = parseInt(operatorMatch?.[2], 10);

  // Use the accessor to preprocess the rowValue if provided
  const processedRowValue = accessor ? accessor(rowValue, rowData) : rowValue;

  // Ensure processedRowValue is an array of strings
  if (!Array.isArray(processedRowValue)) {
    console.warn(
      "Unexpected non-array value in date filtering:",
      processedRowValue
    );
    return false;
  }

  const ranges = processedRowValue.map((dateObj) => dateObj.range || "");

  // Iterate over all ranges and apply the appropriate filtering logic
  return ranges.some((range) => {
    const [start, end] = range.split("-").map(Number);
    if (!isNaN(start) && !isNaN(end)) {
      if (operator === "before") {
        return start < filterYear; // terminus ante quem using end
      } else if (operator === "after") {
        return end > filterYear; // terminus post quem using start
      } else {
        return filterYear >= start && filterYear <= end; // Default range check (inclusive)
      }
    }
    return false; // Skip invalid ranges
  });
}

export function sortByKey(value, data, type, params, component) {
  if (!Array.isArray(value)) return "";
  // Sort by the 'key' property (ascending)
  const sorted = [...value].sort((a, b) => (a.key ?? 0) - (b.key ?? 0));
  // Extract the 'value' property and join with separator
  return sorted.map((ref) => ref.value).join(params.separator || "; ");
}

/* // function to filter numeric not_before and not_After date in separate columns (TPQ and TAQ) 
// worked very good but was not welcomed by the user

export function filterTPQ(headerValue, rowValue, rowData) {
  if (!headerValue) return true; // Show all if no filter value
  const filterValue = parseInt(headerValue); // Parse filter value as integer
  if (isNaN(filterValue)) return true; // Show all if filter value is not a number

  // rowValue is an array of dates, so check if ANY of them is greater than the filter value
  return rowValue.some((date) => {
    const dateValue = parseInt(date); // Parse date value as integer
    return !isNaN(dateValue) && dateValue >= filterValue; // Compare only if date is a number
  });
}

export function filterTAQ(headerValue, rowValue, rowData) {
  if (!headerValue) return true; // Show all if no filter value
  const filterValue = parseInt(headerValue); // Parse filter value as integer
  if (isNaN(filterValue)) return true; // Show all if filter value is not a number

  // rowValue is an array of dates, so check if ANY of them is greater than the filter value
  return rowValue.some((date) => {
    const dateValue = parseInt(date); // Parse date value as integer
    return !isNaN(dateValue) && dateValue <= filterValue; // Compare only if date is a number
  });
} */

/* // To get the century of not_before not_after dates
export function jsonpathGetCentury(value, data, type, params, component) {
  const paths = params.paths;
  const separator = params.separator || ", ";
  
  // Helper function to calculate the century
  const getCentury = (year) => {
    if (!year) return "N/A"; // Handle null or undefined dates
    // get the century  by dividing the year by 100 and round it to the nearest integer 
    // need to add 1 since they use formats 800-899 for 9th c.
  const century = Math.ceil((parseInt(year) + 1) / 100);
  return `${century} Jh.`;
};

// Collect results from each path and convert to centuries
  let allResults = paths.flatMap(path => {
  return JSONPath({ path: path, json: value }).map(date => {
    const year = date ? date.split("-")[0] : null;
    return getCentury(year);
  });
  });

  return [...new Set(allResults)].join(separator); // Remove duplicates
} */
