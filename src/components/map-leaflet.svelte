<script>
  import { onMount, onDestroy } from "svelte";
  import L from "leaflet";
  import "leaflet.markercluster";
  import "leaflet.markercluster/dist/MarkerCluster.css";
  import "leaflet.markercluster/dist/MarkerCluster.Default.css";
  import "leaflet/dist/leaflet.css";

  import { withBasePath } from "@/lib/withBasePath";

  /* ---------- props ---------- */
  export let geoJsonData;
  export let className = "w-full h-64 md:h-96 border rounded z-10";
  export let initialView = [50, 10];
  export let initialZoom = 3;
  export let markerColor = "#B42222";
  export let filterMode = "single"; // "single" | "dual"

  let mapEl;
  let map;
  let authorLayer;
  let libraryLayer;

  /* ---------- icons ---------- */
  const pinGreen = new URL("@/icons/map-pin-green.png", import.meta.url).toString();
  const pinRed = new URL("@/icons/map-pin-red.png", import.meta.url).toString();
  const pin = new URL("@/icons/map-pin.png", import.meta.url).toString();

  const authorIcon = L.icon({
    iconUrl: pinRed,
    iconSize: [25, 25],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  const libraryIcon = L.icon({
    iconUrl: pinGreen,
    iconSize: [25, 25],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  const defaultIcon = L.icon({
    iconUrl: pin,
    iconSize: [25, 25],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  L.Marker.prototype.options.icon = defaultIcon;

  /* ---------- marker updates ---------- */
  function updateMapMarkers(dataToShow) {
    if (!map || !dataToShow?.features) return;

    authorLayer.clearLayers();
    libraryLayer.clearLayers();

    dataToShow.features.forEach((feature) => {
      const { geometry, properties } = feature;
      if (
        geometry?.type === "Point" &&
        geometry.coordinates?.length === 2 &&
        !isNaN(geometry.coordinates[0]) &&
        !isNaN(geometry.coordinates[1])
      ) {
        const type = properties?.type || "author";

        const marker = L.marker(
          [geometry.coordinates[1], geometry.coordinates[0]],
          {
            icon: type === "author" ? authorIcon : libraryIcon,
          }
        );

        if (properties) {
          const url = withBasePath(properties.url || "");
          marker.bindPopup(`
            <div class="map-popup">
              <h3>
                <a href="${url}" class="font-semibold text-base underline decoration-dotted underline-offset-2">
                  ${properties.title || ""}
                </a>
              </h3>
              <p>
                Place: ${properties.place || ""} (${properties.description || ""})<br/>
                ${properties.author ? `Author: ${properties.author}<br/>` : ""}
                ${properties.work ? `Work: ${properties.work}<br/>` : ""}
                ${properties.manuscript ? `MS: ${properties.manuscript}<br/>` : ""}
              </p>
            </div>
          `);
        }

        type === "author"
          ? authorLayer.addLayer(marker)
          : libraryLayer.addLayer(marker);
      }
    });

    // Fit bounds
    const coords = dataToShow.features
      .filter((f) => f.geometry?.type === "Point")
      .map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);

    if (coords.length) {
      map.fitBounds(L.latLngBounds(coords), {
        padding: [50, 50],
        maxZoom: 10,
      });
    }
  }

  /* ---------- external API for Tabulator ---------- */
  $: if (geoJsonData) {
    window.updateMapWithFilteredIds = (filteredIds) => {
      if (!geoJsonData?.features) return;

      let filteredGeoJson;

      if (filterMode === "dual") {
        filteredGeoJson = {
          type: "FeatureCollection",
          features: geoJsonData.features.filter((f) => {
            if (!f.properties) return false;
            if (f.properties.type === "author") {
              return filteredIds.includes(f.properties.aut_jad_id);
            }
            if (f.properties.type === "library") {
              return filteredIds.includes(f.properties.ms_jad_id);
            }
            return false;
          }),
        };
      } else {
        filteredGeoJson = {
          type: "FeatureCollection",
          features: geoJsonData.features.filter(
            (f) => filteredIds.includes(f.properties?.jad_id)
          ),
        };
      }

      updateMapMarkers(filteredGeoJson);
    };
  }

  /* ---------- lifecycle ---------- */
  onMount(() => {
    map = L.map(mapEl).setView(initialView, initialZoom);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    authorLayer = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<div class="bg-brand-800 opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center">${cluster.getChildCount()}</div>`,
          className: "custom-cluster-icon-origin",
          iconSize: [30, 30],
        }),
    });

    libraryLayer = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<div class="bg-sage-900 opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center">${cluster.getChildCount()}</div>`,
          className: "custom-cluster-icon-origin",
          iconSize: [30, 30],
        }),
    });

    map.addLayer(authorLayer);
    map.addLayer(libraryLayer);

    if (geoJsonData?.features) {
      const hasAuthor = geoJsonData.features.some(
        (f) => f.properties?.type === "author"
      );
      const hasLibrary = geoJsonData.features.some(
        (f) => f.properties?.type === "library"
      );

      if (hasAuthor && hasLibrary) {
         L.control
          .layers(
            {},
            {
              '<span class="layer-authors">Authors</span>': authorLayer,
              '<span class="layer-manuscripts">Manuscripts</span>':
                libraryLayer,
            },
            { collapsed: false },
          )
          .addTo(map);
      }

      updateMapMarkers(geoJsonData);
    }
  });

  onDestroy(() => {
    delete window.updateMapWithFilteredIds;
    map?.remove();
  });
</script>

<div bind:this={mapEl} class={className} id="leaflet-map" ></div>
