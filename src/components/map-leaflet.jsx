import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet/dist/leaflet.css";
import { withBasePath } from "@/lib/withBasePath";

// Create custom icon
const pinGreen = new URL(
  "@/icons/map-pin-green.png",
  import.meta.url
).toString();
const pinRed = new URL("@/icons/map-pin-red.png", import.meta.url).toString();
const pin = new URL("@/icons/map-pin.png", import.meta.url).toString();

const authorIcon = L.icon({
  iconUrl: pinRed, // Use the same pin image
  iconSize: [25, 25], // Adjust size as needed
  iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
  popupAnchor: [0, -41], // Point from which the popup should open relative to the iconAnchor
});

const libraryIcon = L.icon({
  iconUrl: pinGreen, // Use the same pin image
  iconSize: [25, 25], // Adjust size as needed
  iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
  popupAnchor: [0, -41], // Point from which the popup should open relative to the iconAnchor
});
const customIcon = L.icon({
  iconUrl: pin,
  iconSize: [25, 25], // size of the icon, adjust as needed
  iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -41], // point from which the popup should open relative to the iconAnchor
});

// Set as default icon
L.Marker.prototype.options.icon = customIcon;

export default function LeafletMap({
  geoJsonData,
  className = "w-full h-64 md:h-96 border rounded z-10",
  initialView = [50, 10],
  initialZoom = 3,
  markerColor = "#B42222",
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(null);
  const authorLayerRef = useRef(null);
  const libraryLayerRef = useRef(null);

  // Create a method that can be called from outside to update the map
  useEffect(() => {
    // Make the updateMap function available globally to be called in tabulator by table.on filter
    window.updateMapWithFilteredIds = (filteredIds) => {
      if (!geoJsonData || !geoJsonData.features) return;

      // Filter the geoJsonData to only include features with matching jad_ids
      // Since table sends ms_transmission jad_ids, we need to check against those
      const filteredGeoJson = {
        type: "FeatureCollection",
        features: geoJsonData.features.filter(
          (feature) =>
            feature.properties &&
            filteredIds.includes(feature.properties.jad_id)
        ),
      };

      updateMapMarkers(filteredGeoJson);
    };

    return () => {
      // Clean up the global function when component unmounts
      delete window.updateMapWithFilteredIds;
    };
  }, [geoJsonData]);

  // Function to update markers on the map
  const updateMapMarkers = (dataToShow) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers cluster group if it exists
    authorLayerRef.current.clearLayers();
    libraryLayerRef.current.clearLayers();

    // DEBUG: Count features by type
    const authorCount = dataToShow.features.filter(
      (f) => f.properties?.type === "author"
    ).length;
    const libraryCount = dataToShow.features.filter(
      (f) => f.properties?.type === "library"
    ).length;
    console.log(
      "Features to plot - Authors:",
      authorCount,
      "Libraries:",
      libraryCount
    );

    // Add markers for filtered data
    dataToShow.features.forEach((feature) => {
      const { geometry, properties } = feature;

      if (
        geometry &&
        geometry.type === "Point" &&
        geometry.coordinates.length === 2 &&
        !isNaN(geometry.coordinates[0]) &&
        !isNaN(geometry.coordinates[1])
      ) {
        // Create a marker with the appropriate icon based on properties.type
        properties.type = properties.type || "author"; // Default to "author" if type is not specified
        const marker = L.marker(
          [geometry.coordinates[1], geometry.coordinates[0]],
          {
            icon: properties.type === "author" ? authorIcon : libraryIcon,
          }
        );
        if (properties) {
          const url = withBasePath(properties.url || "");
          const popupContent = `
                        <div class="map-popup">
                            <h3><a href=${url} class="font-semibold italic text-base underline decoration-dotted underline-offset-2">${
            properties.title || ""
          } </a><br/></h3>
                            <p>Place: ${properties.place || ""} (${
            properties.description
          }) <br/>														
							${properties.author ? `Author: ${properties.author} <br/>` : ""}	
                             ${
                               properties.work
                                 ? `Work: ${properties?.work} <br/>`
                                 : ""
                             }	
							${properties.manuscript ? `MS: ${properties.manuscript} <br/>` : ""}	
							</p> 
                        </div>
                    `;
          marker.bindPopup(popupContent);
        }
        // Add marker to the appropriate layer based on properties.type
        if (properties.type === "author") {
          authorLayerRef.current.addLayer(marker);
        } else if (properties.type === "library") {
          libraryLayerRef.current.addLayer(marker);
        }
      }
    });

    // Fit bounds if there are features
    if (dataToShow.features.length > 0) {
      try {
        const coordinates = dataToShow.features
          .filter((f) => f.geometry && f.geometry.type === "Point")
          .map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);

        if (coordinates.length > 0) {
          const bounds = L.latLngBounds(coordinates);
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 10,
          });
        }
      } catch (error) {
        console.warn("Could not fit bounds:", error);
      }
    }
  };

  useEffect(() => {
    // Initialize map if it doesn't exist yet
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current).setView(initialView, initialZoom);

      // Add OpenStreetMap tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      const authorLayer = L.markerClusterGroup({
        spiderfyOnMaxZoom: true, // Enable spiderfy when zoomed in
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        // add some offset to avoid overlapping clusters
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          const offsetX = Math.random() * 10 - 5;
          const offsetY = Math.random() * 10 - 5;
          return L.divIcon({
            html: `<div class="bg-brand-800 opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center">${count}</div>`,
            className: "custom-cluster-icon-origin",
            iconSize: [30, 30],
            iconAnchor: [25 + offsetX, 25 + offsetY], // Apply the offset
          });
        },
      });

      const libraryLayer = L.markerClusterGroup({
        spiderfyOnMaxZoom: true, // Enable spiderfy when zoomed in
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          const offsetX = Math.random() * 10 + 5;
          const offsetY = Math.random() * 10 + 5;
          return L.divIcon({
            html: `<div class="bg-sage-900 opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center">${count}</div>`,
            className: "custom-cluster-icon-origin",
            iconSize: [30, 30],
            iconAnchor: [25 + offsetX, 25 + offsetY],
          });
        },
      });

      authorLayerRef.current = authorLayer;
      libraryLayerRef.current = libraryLayer;

      // Add the marker cluster groups to the map
      map.addLayer(authorLayer);
      map.addLayer(libraryLayer);

      // Add layer control if types are present i.e. more than one layer

      // Check if there are features with defined types
      const hasAuthorType = geoJsonData.features.some(
        (f) => f.properties?.type === "author"
      );
      const hasLibraryType = geoJsonData.features.some(
        (f) => f.properties?.type === "library"
      );

      // Only add layer control if we have both types
      if (hasAuthorType && hasLibraryType) {
        L.control
          .layers(
            {},
            {
              Authors: authorLayer,
              Manuscripts: libraryLayer,
            },
            { collapsed: false }
          )
          .addTo(map);
      }
      // Store map instance for cleanup
      mapInstanceRef.current = map;
    }

    // Initial load of all data
    updateMapMarkers(geoJsonData);

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      authorLayerRef.current = null;
      libraryLayerRef.current = null;
    };
  }, [geoJsonData, initialView, initialZoom, markerColor]);

  return <div ref={mapRef} className={className} id="leaflet-map"></div>;
}
