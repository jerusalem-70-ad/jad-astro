/**
 * Builds transmission graph data for all passages, formatted for ECharts visualization
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
   * Format a passage node for the tree
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
      jad_id: node.jad_id,
      depth: depth,
      nodeType: nodeType,
      // We'll keep the children array for the tree structure
      children: [],
    };
  }

  /**
   * Build the ancestors part of the tree
   */
  function buildAncestors(node, visited = new Set(), depth = 0) {
    if (!node || visited.has(node.id)) return [];

    visited.add(node.id);
    const sources = node.source_passage || [];

    if (sources.length === 0) {
      return [];
    }

    return sources
      .map((src) => {
        const sourceNode = idMap.get(src.id);
        if (!sourceNode || visited.has(sourceNode.id)) return null;

        const formattedSource = formatNode(sourceNode, depth, "ancestor");
        formattedSource.children = buildAncestors(
          sourceNode,
          new Set(visited),
          depth + 1
        );

        return formattedSource;
      })
      .filter(Boolean);
  }

  /**
   * Build the descendants part of the tree
   */
  function buildDescendants(node, visited = new Set(), depth = 0) {
    if (!node || visited.has(node.id)) return [];

    visited.add(node.id);
    const descendants = descendantsMap.get(node.id) || [];

    return descendants
      .map((desc) => {
        if (visited.has(desc.id)) return null;

        const formattedDesc = formatNode(desc, depth, "descendant");
        formattedDesc.children = buildDescendants(
          desc,
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
    // Create the central/current node
    const rootNode = formatNode(p, 0, "current");

    // Add ancestors and descendants as children
    rootNode.children = [...buildAncestors(p), ...buildDescendants(p)];

    // Store the full tree for this passage
    result[p.id] = {
      id: p.id,
      tree: rootNode,
      metadata: {
        ancestorCount: rootNode.children.filter(
          (c) => c.nodeType === "ancestor"
        ).length,
        descendantCount: rootNode.children.filter(
          (c) => c.nodeType === "descendant"
        ).length,
      },
    };
  });

  return result;
}
