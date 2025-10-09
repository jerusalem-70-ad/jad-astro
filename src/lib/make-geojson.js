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
// for works

export function processWorks(input) {
  // Check if used on detail view page for single ms (data not an array) or for mss table page
  // If the input is not an array, wrap it in an array
  const works = Array.isArray(input) ? input : [input];

  return {
    type: "FeatureCollection",
    features: works
      .flatMap((work) => {
        const geojson = [
          // AUTHOR FEATURES
          ...(work?.author?.[0]?.place?.map((pl) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
            },
            properties: {
              title: `${work.author[0].name}, ${work.title}`,
              description: `Author's working place`,
              place: pl.value,
              type: "author",
              url: `/works/${work.jad_id}`,
              jad_id: work.jad_id, // to match the table filtering
              place_id: pl.id,
            },
          })) || []),

          // LIBRARY FEATURES (from manuscripts)
          ...(work.manuscripts?.flatMap(
            (ms) =>
              ms.place.map((pl) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
                },
                properties: {
                  title: `${work.author[0].name}, ${work.title}`,
                  description: `MS location`,
                  place: pl.value,
                  manuscript: ms.name || "N/A",
                  type: "library",
                  url: `/works/${work.jad_id}`,
                  jad_id: work.jad_id, // to match the table filtering
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

export function processMss(input) {
  // Check if used on detail view page for single ms (data not an array) or for mss table page
  // If the input is not an array, wrap it in an array
  const manuscripts = Array.isArray(input) ? input : [input];

  return {
    type: "FeatureCollection",
    features: manuscripts
      .flatMap((ms) => {
        const geojson = [
          // LIBRARY FEATURES
          ...(ms.library?.flatMap(
            (lib) =>
              lib.place?.map((pl) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
                },
                properties: {
                  title: ms.name[0].value,
                  description: `Repository`,
                  place: pl.value,
                  type: "library",
                  url: `/manuscripts/${ms.jad_id}`,
                  jad_id: ms.jad_id, // to match the table filtering
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

export function processAuthors(input) {
  // Check if used on detail view page for single ms (data not an array) or for mss table page
  // If the input is not an array, wrap it in an array
  const authors = Array.isArray(input) ? input : [input];

  return {
    type: "FeatureCollection",
    features: authors
      .flatMap((aut) => {
        const geojson = [
          // AUTHOR FEATURES
          ...(aut.place?.map((pl) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [parseFloat(pl.long), parseFloat(pl.lat)],
            },
            properties: {
              title: aut.name,
              description: "Authors place",
              place: pl.value,
              type: "library",
              url: `/authors/${aut.jad_id}`,
              jad_id: aut.jad_id, // to match the table filtering
              place_id: pl.id,
            },
          })) || []),
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
