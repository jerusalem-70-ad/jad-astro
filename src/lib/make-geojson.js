// geoJson data for passages.json

export function processData(input) {
  // Check if used on detail view page for single ms (data not an array) or for mss table page
  // If the input is not an array, wrap it in an array
  const passages = Array.isArray(input) ? input : [input];

  return {
    type: "FeatureCollection",
    features: passages
      .flatMap((passage) => {
        const geojson = [
          // AUTHOR FEATURES
          ...(passage.work?.[0]?.author?.[0]?.place?.map((pl) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
            },
            properties: {
              title: `(${passage.id}) ${passage.passage.slice(0, 20)}...`,
              description: `Author's working place`,
              author: passage.work[0].author[0].name,
              work: passage.work[0].title,
              place: pl.value,
              type: "author",
              url: `/passages/${passage.jad_id}`,
              jad_id: passage.jad_id, // to match the table filtering
              place_id: pl.id,
            },
          })) || []),

          // LIBRARY FEATURES (from manuscripts)
          ...(passage.mss_occurrences?.flatMap(
            (occurr) =>
              occurr.lib_place?.map((pl) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
                },
                properties: {
                  title: `(${passage.id}) ${passage.passage.slice(0, 32)}...`,
                  description: `Library location`,
                  place: pl.value,
                  manuscript: occurr.manuscript || "N/A",
                  type: "library",
                  url: `/passages/${passage.jad_id}`,
                  jad_id: passage.jad_id, // to match the table filtering
                  place_id: pl.id,
                },
              })) || []
          ) || []),
        ];

        return geojson;
      })
      .filter((f) => f.geometry.coordinates.every((coord) => !isNaN(coord))), // Filter out invalid coordinates
  };
}
// helpers function
function formatPeriod(prov) {
  const fromDate = prov.from?.[0]?.value || "N/A";
  const tillDate = prov.till?.[0]?.value || "N/A";

  const fromUncertain = prov.uncertain_from ? " (?)" : "";
  const tillUncertain = prov.uncertain_till ? " (?)" : "";

  if (fromDate === "N/A" && tillDate === "N/A") {
    return "N/A";
  }

  return `From: ${fromDate}${fromUncertain} to ${tillDate}${tillUncertain}`;
}
