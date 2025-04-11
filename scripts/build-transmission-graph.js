/**
 * Builds transmission graph data for all passages, formatted for ECharts network visualization
 * @param {Array} passages - Array of passage objects
 * @returns {Object} - Map of passage ID to transmission graph data
 */
export function buildTransmissionGraph(passages) {
  const idMap = new Map();
  passages.forEach((p) => idMap.set(p.id, p));

  // Create a map of descendants (id -> [descendants...])
  const descendantsMap = new Map();
  passages.forEach((p) => {
    (p.source_passage || []).forEach((source) => {
      if (!descendantsMap.has(source.id)) {
        descendantsMap.set(source.id, []);
      }
      descendantsMap.get(source.id).push(p);
    });
  });

  /**
   * Format a passage node with basic information
   */
  function formatNode(node, depth, nodeType = "regular") {
    const workName = node.work?.[0]?.name || "";
    const authorName =
      node.work?.[0]?.author?.map((a) => a.name).join(", ") || "";
    return {
      name: `${authorName}: ${workName}`,
      id: node.id,
      work: workName,
      author: authorName,
      passage: node.passage,
      jad_id: node.jad_id,
      depth: depth,
      nodeType: nodeType,
    };
  }

  // Build the transmission graph for each passage
  const result = {};
  passages.forEach((p) => {
    // Create Maps/Arrays to collect unique nodes and links
    const graphNodes = new Map();
    const graphLinks = [];

    // Create and add the central/current node
    const rootNode = formatNode(p, 0, "current");
    graphNodes.set(p.id, rootNode);

    // Process ancestors (sources)
    function processAncestors(node, visited = new Set(), depth = 0) {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);

      const sources = node.source_passage || [];
      for (const src of sources) {
        const sourceNode = idMap.get(src.id);
        if (!sourceNode) continue;

        // Add source node to the graph if not already there
        if (!graphNodes.has(sourceNode.id)) {
          graphNodes.set(
            sourceNode.id,
            formatNode(sourceNode, depth, "ancestor")
          );
        }

        // Add link to graphLinks - for ancestors, the source should be the older text
        graphLinks.push({
          source: sourceNode.id, // Older text (the source being referenced)
          target: node.id, // Newer text (the one doing the referencing)
          depth: depth,
          type: "ancestor", // Mark the link type for styling if needed
        });

        // Process this source's own sources
        processAncestors(sourceNode, new Set(visited), depth + 1);
      }
    }

    // Process descendants
    function processDescendants(nodeId, visited = new Set(), depth = 0) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const descendants = descendantsMap.get(nodeId) || [];
      for (const desc of descendants) {
        // Add descendant node to the graph if not already there
        if (!graphNodes.has(desc.id)) {
          graphNodes.set(desc.id, formatNode(desc, depth, "descendant"));
        }

        // Add link to graphLinks - for descendants, the flow is from the current text to the newer one
        graphLinks.push({
          source: nodeId, // Older text
          target: desc.id, // Newer text (the descendant)
          depth: depth,
          type: "descendant", // Mark the link type for styling if needed
        });

        // Process this descendant's own descendants
        processDescendants(desc.id, new Set(visited), depth + 1);
      }
    }

    // Build the network data
    processAncestors(p);
    processDescendants(p.id);

    // Convert nodes Map to array for ECharts
    const nodes = Array.from(graphNodes.values());

    // Store the formatted data
    result[p.id] = {
      id: p.id,
      graph: {
        nodes: nodes,
        links: graphLinks,
      },
      metadata: {
        ancestorCount: nodes.filter((n) => n.nodeType === "ancestor").length,
        descendantCount: nodes.filter((n) => n.nodeType === "descendant")
          .length,
      },
    };
  });

  return result;
}
