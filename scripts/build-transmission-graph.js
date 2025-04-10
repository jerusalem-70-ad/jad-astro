export function buildTransmissionGraph(passages) {
  const idMap = new Map();
  passages.forEach((p) => idMap.set(p.id, p));

  const descendantsMap = new Map(); // id -> [descendants...]
  passages.forEach((p) => {
    (p.source_passage || []).forEach((source) => {
      if (!descendantsMap.has(source.id)) {
        descendantsMap.set(source.id, []);
      }
      descendantsMap.get(source.id).push(p);
    });
  });

  function formatNode(node, depth) {
    return {
      id: node.id,
      work: node.work?.[0]?.name || "",
      author: node.work?.[0]?.author?.map((a) => a.name).join(", ") || "",
      jad_id: node.jad_id,
      depth,
      children: [],
    };
  }

  function buildDescendantsTree(node, visited = new Set(), depth = 1) {
    if (visited.has(node.id)) return null;
    visited.add(node.id);

    const children = (descendantsMap.get(node.id) || [])
      .map((desc) => {
        const formatted = formatNode(desc, depth);
        formatted.children =
          buildDescendantsTree(desc, new Set(visited), depth + 1) || [];
        return formatted;
      })
      .filter(Boolean);

    return children;
  }

  function buildAncestorsTree(node, visited = new Set(), depth = 1) {
    if (visited.has(node.id)) return [];
    visited.add(node.id);

    const sources = node.source_passage || [];

    if (sources.length === 0) {
      // Base ancestor node
      return [
        {
          id: node.id,
          work: node.work?.[0]?.name || "",
          author: node.work?.[0]?.author?.map((a) => a.name).join(", ") || "",
          jad_id: node.jad_id,
          depth,
          children: [],
        },
      ];
    }

    // Build upward, then attach current node as a child
    const trees = sources
      .map((src) => {
        const sourceNode = idMap.get(src.id);
        if (!sourceNode || visited.has(sourceNode.id)) return null;

        const subtrees = buildAncestorsTree(
          sourceNode,
          new Set(visited),
          depth + 1
        );

        // Attach current node as a child to each path
        return subtrees.map((ancestor) => {
          return {
            ...ancestor,
            children: [
              ...(ancestor.children || []),
              {
                id: node.id,
                work: node.work?.[0]?.name || "",
                author:
                  node.work?.[0]?.author?.map((a) => a.name).join(", ") || "",
                jad_id: node.jad_id,
                depth,
                children: [],
              },
            ],
          };
        });
      })
      .flat()
      .filter(Boolean);

    return trees;
  }

  const result = {};
  passages.forEach((p) => {
    result[p.id] = {
      id: p.id,
      descendants_tree: buildDescendantsTree(p), // array
      ancestors_tree: buildAncestorsTree(p), // array
    };
  });

  return result;
}
