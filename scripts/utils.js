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
