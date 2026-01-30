/**
 * Transform passages data into network format for ECharts visualization
 * This runs at build time during data preprocessing
 */

/**
 * Transform all passages into network data
 * @param {Array} passages - Array of passage objects with source_passage relationships
 * @returns {Object} - Network data with nodes and links for ECharts
 */
export function createNetworkData(passagesArray) {
  const nodes = [];
  const links = [];

  // First pass: create all nodes from passages
  passagesArray.forEach((passage, index) => {
    // Extract work information (following your existing pattern)
    const work = passage.work?.[0] || {};
    const author = work.author?.[0]?.name || "Unknown Author";
    const workTitle = work.name || "Unknown Work";
    const dateNotBefore = work.date?.[0]?.not_before || 0;
    const dateNotAfter = work.date?.[0]?.not_after || 0;
    const angle = (index * 2 * Math.PI) / passagesArray.length;
    const radius = 150;

    nodes.push({
      id: passage.jad_id,
      name: `${author}: ${workTitle}`,
      passage: passage.passage,
      author: author,
      work: workTitle,
      dateNotBefore: dateNotBefore,
      dateNotAfter: dateNotAfter,
      century: getCenturyByDate(dateNotBefore),
      // Initial position in a circle
      x: Math.cos(angle) * radius + radius,
      y: Math.sin(angle) * radius + radius,
    });
  });

  // Second pass: create links from source_passage relationships
  passagesArray.forEach((passage) => {
    if (passage.source_passage && passage.source_passage.length > 0) {
      passage.source_passage.forEach((source) => {
        // Find the source passage in our data
        const sourcePassage = passagesArray.find(
          (p) =>
            p.id === source.id ||
            p.passage === source.value ||
            p.jad_id === source.jad_id,
        );

        if (sourcePassage) {
          links.push({
            source: sourcePassage.jad_id,
            target: passage.jad_id,
          });
        }
      });
    }
  });

  return {
    nodes: nodes,
    links: links,
  };
}

/**
 * Helper function to assign colors based on date ranges
 */
function getCenturyByDate(date) {
  if (date < 600) return "pre 600";
  if (date < 700) return "7th c.";
  if (date < 800) return "8th c.";
  if (date < 900) return "9th c.";
  if (date < 1000) return "10th c.";
  if (date < 1100) return "11th c.";
  if (date < 1200) return "12th c.";
  if (date < 1300) return "after 1300";
}

/**
 * Create ECharts option for the complete network visualization
 * @param {Object} networkData - The network data with nodes and links
 * @returns {Object} - ECharts configuration object
 */
export function createNetworkOption(networkData) {
  return {
    title: {
      text: "All Passages Network",
      subtext:
        "Complete network of passage relationships arranged chronologically",
      left: "center",
    },
    tooltip: {
      trigger: "item",
      formatter: function (params) {
        if (params.dataType === "node") {
          return `
            <strong>${params.data.name}</strong><br/>
            Date: ${params.data.dateNotBefore} - ${params.data.dateNotAfter}<br/>
            <div style="max-width: 300px; word-wrap: break-word;">
              <em>"${params.data.passage}"</em>
            </div>
          `;
        } else {
          return `Source relationship`;
        }
      },
    },
    yAxis: {
      type: "value",
      name: "Year",
      min: (value) => value.min - 10,
      max: (value) => value.max + 10,
      axisLabel: {
        fontSize: 12,
        interval: function (_index, value) {
          // Show only values that are multiples of 50
          return value % 50 === 0;
        },
      },
      splitNumber: 10,
    },
    xAxis: {
      type: "value",
      name: "Passages",
      show: false,
    },

    series: [
      {
        name: "Passages Network",
        type: "graph",
        layout: "none",
        data: networkData.nodes,
        links: networkData.links,
        roam: true,
        coordinateSystem: "cartesian2d",
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.3)",
        },
        lineStyle: {
          color: "#95a5a6",
          curveness: 0.2,
          opacity: 0.7,
        },
        emphasis: {
          focus: "adjacency",
          lineStyle: { width: 4, color: "#444" },
          itemStyle: { borderWidth: 2, borderColor: "#fff" },
        },
      },
    ],
    toolbox: {
      show: true,
      orient: "vertical",
      right: "20",
      top: "top",
      itemSize: 20,
      itemGap: 20,
      feature: {
        saveAsImage: {
          show: true,
          title: "Download as PNG",
          type: "png",
          pixelRatio: 2, // Higher quality
          backgroundColor: "#fff",
        },
        dataZoom: {
          show: config.enableZoom,
          title: {
            zoom: "Zoom",
            back: "Reset Zoom",
          },
        },
        restore: { show: true, title: "Reset View" },
      },
    },
  };
}
