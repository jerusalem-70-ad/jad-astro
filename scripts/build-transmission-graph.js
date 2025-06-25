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
        allRelatedPassages: nodes.filter((node) => node.nodeType !== "current")
          .length,
      },
    };
  });

  function assignXCoordinates(nodes, links) {
    const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

    // Build parent-child relationships based on the actual links
    const childrenMap = {}; // parent -> [children]
    const parentsMap = {}; // child -> [parents]

    links.forEach((link) => {
      // source -> target represents the flow of influence
      if (!childrenMap[link.source]) childrenMap[link.source] = [];
      childrenMap[link.source].push(link.target);

      if (!parentsMap[link.target]) parentsMap[link.target] = [];
      parentsMap[link.target].push(link.source);
    });

    // 1. Set current node at x = 5
    const current = nodes.find((n) => n.nodeType === "current");
    if (current) {
      current.x = 5;
    }

    // 2. Process ancestors (going backwards in time, increasing depth)
    const ancestors = nodes.filter((n) => n.nodeType === "ancestor");
    processNodeGroup(ancestors, childrenMap, nodeMap, "ancestor");

    // 3. Process descendants (going forward in time, increasing depth)
    const descendants = nodes.filter((n) => n.nodeType === "descendant");
    processNodeGroup(descendants, parentsMap, nodeMap, "descendant");
  }

  function processNodeGroup(nodes, connectionMap, nodeMap, groupType) {
    if (nodes.length === 0) return;

    // Group nodes by depth
    const depthGroups = {};
    nodes.forEach((node) => {
      if (!depthGroups[node.depth]) depthGroups[node.depth] = [];
      depthGroups[node.depth].push(node);
    });

    const depths = Object.keys(depthGroups)
      .map(Number)
      .sort((a, b) => a - b);

    depths.forEach((depth) => {
      const nodesAtDepth = depthGroups[depth];

      if (depth === 1) {
        // First level: spread evenly across x = 1 to 9
        spreadNodesEvenly(nodesAtDepth, 1, 9);
      } else {
        // Higher depths: position based on parent positions
        positionBasedOnParents(nodesAtDepth, connectionMap, nodeMap);
      }
    });
  }

  function spreadNodesEvenly(nodes, minX, maxX) {
    if (nodes.length === 1) {
      nodes[0].x = 5; // Center single node
    } else {
      const spacing = (maxX - minX) / (nodes.length - 1);
      nodes.forEach((node, index) => {
        node.x = minX + index * spacing;
      });
    }
  }

  function positionBasedOnParents(nodes, connectionMap, nodeMap) {
    // Group nodes by their parent positions
    const parentGroups = new Map();

    nodes.forEach((node) => {
      const connectedParentIds = connectionMap[node.id] || [];
      const connectedParents = connectedParentIds
        .map((id) => nodeMap[id])
        .filter((parent) => parent && parent.x !== undefined);

      if (connectedParents.length > 0) {
        // Calculate average x position of parents
        const avgParentX =
          connectedParents.reduce((sum, parent) => sum + parent.x, 0) /
          connectedParents.length;
        const parentKey = Math.round(avgParentX * 10) / 10; // Round to avoid floating point issues

        if (!parentGroups.has(parentKey)) {
          parentGroups.set(parentKey, []);
        }
        parentGroups.get(parentKey).push(node);
      } else {
        // If no connected parents found, place at center
        node.x = 5;
      }
    });

    // Check if all nodes belong to a single parent group
    // If so, spread them across the full range instead of clustering
    if (parentGroups.size === 1 && nodes.length > 1) {
      spreadNodesEvenly(nodes, 1, 9);
      return;
    }

    // Position nodes within each parent group
    parentGroups.forEach((groupNodes, parentX) => {
      if (groupNodes.length === 1) {
        groupNodes[0].x = parentX;
      } else {
        // Spread siblings around parent position with small offsets
        const offsetRange = Math.min(2, 8 / groupNodes.length); // Max offset of 2 units
        const spacing = offsetRange / (groupNodes.length - 1);

        groupNodes.forEach((node, index) => {
          const offset = (index - (groupNodes.length - 1) / 2) * spacing;
          node.x = Math.max(1, Math.min(9, parentX + offset));
        });
      }
    });
  }

  // Assign x coordinates for layout
  Object.values(result).forEach((r) =>
    assignXCoordinates(r.graph.nodes, r.graph.links)
  );

  return result;
}
