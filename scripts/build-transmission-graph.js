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
    const workDate = node.work?.[0]?.date[0]?.not_before || "";
    return {
      name: `${authorName}: ${workName}`,
      id: node.id,
      work: workName,
      author: authorName,
      date: workDate,
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
        } else {
          // Update depth if this path yields a shallower ancestor
          const existing = graphNodes.get(sourceNode.id);
          if (existing.depth > depth + 1) {
            existing.depth = depth + 1;
          }
        }

        // Add link to graphLinks - for ancestors, the source should be the older text
        graphLinks.push({
          source: sourceNode.id, // Older text (the source being referenced)
          target: node.id, // Newer text (the one doing the referencing)
          depth: depth,
          type: "ancestor", // Mark the link type for styling if needed
        });

        // Process this source's own sources
        processAncestors(sourceNode, visited, depth + 1);
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

  function assignXCoordinates(nodes, links) {
    const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

    // Create adjacency maps for both directions
    const childrenMap = {}; // parent -> [children]
    const parentsMap = {}; // child -> [parents]

    // Build both maps from links
    links.forEach((link) => {
      // Children map: source -> targets
      if (!childrenMap[link.source]) childrenMap[link.source] = [];
      childrenMap[link.source].push(link.target);

      // Parents map: target -> sources
      if (!parentsMap[link.target]) parentsMap[link.target] = [];
      parentsMap[link.target].push(link.source);
    });

    // 1. Set current node at x = 5
    const current = nodes.find((n) => n.nodeType === "current");
    if (current) current.x = 5;

    // 2. Spread depth 0 nodes evenly between x = 1 and x = 9
    const depth0 = nodes.filter(
      (n) => n.depth === 0 && n.nodeType !== "current"
    );

    if (depth0.length > 0) {
      if (depth0.length === 1) {
        depth0[0].x = 5; // Center single node
      } else {
        const spacing = 8 / (depth0.length - 1);
        depth0.forEach((n, i) => {
          n.x = 1 + i * spacing;
        });
      }
    }

    // 3. For nodes with depth > 0, inherit x from connected nodes at previous depth
    const maxDepth = Math.max(...nodes.map((n) => n.depth));

    for (let d = 1; d <= maxDepth; d++) {
      const thisDepth = nodes.filter((n) => n.depth === d);

      thisDepth.forEach((n) => {
        // Find connected nodes at depth d-1
        let parentXs = [];

        // Check parents (for descendants going forward in time)
        if (parentsMap[n.id]) {
          const connectedParents = parentsMap[n.id]
            .map((id) => nodeMap[id])
            .filter(
              (parent) =>
                parent && parent.depth === d - 1 && parent.x !== undefined
            );
          parentXs.push(...connectedParents.map((p) => p.x));
        }

        // Check children (for ancestors going backward in time)
        if (childrenMap[n.id]) {
          const connectedChildren = childrenMap[n.id]
            .map((id) => nodeMap[id])
            .filter(
              (child) => child && child.depth === d - 1 && child.x !== undefined
            );
          parentXs.push(...connectedChildren.map((c) => c.x));
        }

        if (parentXs.length > 0) {
          // Use average x of connected nodes at previous depth
          const baseX = parentXs.reduce((a, b) => a + b, 0) / parentXs.length;

          // If multiple nodes at this depth share the same parent, spread them out
          const siblingsAtSameDepth = thisDepth.filter((sibling) => {
            if (sibling === n) return false;

            let siblingParentXs = [];
            if (parentsMap[sibling.id]) {
              const siblingConnectedParents = parentsMap[sibling.id]
                .map((id) => nodeMap[id])
                .filter(
                  (parent) =>
                    parent && parent.depth === d - 1 && parent.x !== undefined
                );
              siblingParentXs.push(...siblingConnectedParents.map((p) => p.x));
            }
            if (childrenMap[sibling.id]) {
              const siblingConnectedChildren = childrenMap[sibling.id]
                .map((id) => nodeMap[id])
                .filter(
                  (child) =>
                    child && child.depth === d - 1 && child.x !== undefined
                );
              siblingParentXs.push(...siblingConnectedChildren.map((c) => c.x));
            }

            if (siblingParentXs.length === 0) return false;
            const siblingBaseX =
              siblingParentXs.reduce((a, b) => a + b, 0) /
              siblingParentXs.length;
            return Math.abs(siblingBaseX - baseX) < 0.1; // Same parent group
          });

          // Assign positions with small offsets for siblings
          if (siblingsAtSameDepth.length > 0) {
            const allSiblingsIncludingCurrent = [n, ...siblingsAtSameDepth];
            const totalSiblings = allSiblingsIncludingCurrent.length;
            const currentIndex = allSiblingsIncludingCurrent.indexOf(n);

            // Spread siblings around the base position
            const offset = (currentIndex - (totalSiblings - 1) / 2) * 0.5;
            n.x = Math.max(0, Math.min(10, baseX + offset));
          } else {
            n.x = Math.max(0, Math.min(10, baseX));
          }
        }
      });
    }
  }

  // Assign x coordinates for layout
  Object.values(result).forEach((r) =>
    assignXCoordinates(r.graph.nodes, r.graph.links)
  );

  return result;
}
