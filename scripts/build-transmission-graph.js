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
      name: `${workName} (${authorName})`,
      id: node.id,
      work: workName,
      author: authorName,
      passage: node.passage,
      jad_id: node.jad_id,
      depth: depth,
      nodeType: nodeType,
      // Keep children array for backward compatibility
      children: [],
    };
  }

  /**
   * Build the ancestors part of the tree while tracking edges for the network graph
   */
  function buildAncestors(
    node,
    graphNodes,
    graphLinks,
    visited = new Set(),
    depth = 0
  ) {
    if (!node || visited.has(node.id)) return [];
    visited.add(node.id);

    const sources = node.source_passage || [];
    if (sources.length === 0) {
      return [];
    }

    return sources
      .map((src) => {
        const sourceNode = idMap.get(src.id);
        if (!sourceNode) return null;

        // Create the formatted node
        const formattedSource = formatNode(sourceNode, depth, "ancestor");

        // Add to graphNodes if not already there
        if (!graphNodes.has(sourceNode.id)) {
          graphNodes.set(sourceNode.id, formattedSource);
        }

        // Add link to graphLinks
        graphLinks.push({
          source: node.id,
          target: sourceNode.id,
          depth: depth,
        });

        // Only process children if we haven't seen this node
        if (!visited.has(sourceNode.id)) {
          formattedSource.children = buildAncestors(
            sourceNode,
            graphNodes,
            graphLinks,
            new Set(visited),
            depth + 1
          );
        }

        return formattedSource;
      })
      .filter(Boolean);
  }

  /**
   * Build the descendants part of the tree while tracking edges for the network graph
   */
  function buildDescendants(
    node,
    graphNodes,
    graphLinks,
    visited = new Set(),
    depth = 0
  ) {
    if (!node || visited.has(node.id)) return [];
    visited.add(node.id);

    const descendants = descendantsMap.get(node.id) || [];
    return descendants
      .map((desc) => {
        if (visited.has(desc.id)) return null;

        // Create the formatted node
        const formattedDesc = formatNode(desc, depth, "descendant");

        // Add to graphNodes if not already there
        if (!graphNodes.has(desc.id)) {
          graphNodes.set(desc.id, formattedDesc);
        }

        // Add link to graphLinks
        graphLinks.push({
          source: node.id,
          target: desc.id,
          depth: depth,
        });

        // Process children
        formattedDesc.children = buildDescendants(
          desc,
          graphNodes,
          graphLinks,
          new Set(visited),
          depth + 1
        );

        return formattedDesc;
      })
      .filter(Boolean);
  }

  // Build the transmission graph for each passage
  const result = {};
  passages.forEach((p) => {
    // Create Maps/Arrays to collect unique nodes and links
    const graphNodes = new Map();
    const graphLinks = [];

    // Create the central/current node
    const rootNode = formatNode(p, 0, "current");

    // Add root node to graphNodes
    graphNodes.set(p.id, rootNode);

    // Build tree structure (for backward compatibility) and collect network data
    rootNode.children = [
      ...buildAncestors(p, graphNodes, graphLinks),
      ...buildDescendants(p, graphNodes, graphLinks),
    ];

    // Convert nodes Map to array for ECharts
    const nodes = Array.from(graphNodes.values());

    // Store all formatted data
    result[p.id] = {
      id: p.id,
      // Maintain the tree structure for backward compatibility
      tree: rootNode,
      // Add network graph data structure (just the pure data, no styling)
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
