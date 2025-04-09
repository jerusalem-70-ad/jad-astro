export function buildTransmissionGraph(passages) {
  const idMap = new Map();
  passages.forEach((p) => idMap.set(p.id, p));

  function buildTransmissionTree(node, visited = new Set(), depth = 0) {
    if (visited.has(node.id)) return null;
    visited.add(node.id);

    const children = (node.children || [])
      .map((child) => buildTransmissionTree(child, new Set(visited), depth + 1))
      .filter(Boolean);

    return {
      id: node.id,
      work: node.work?.[0]?.name || "",
      author: node.work?.[0]?.author?.map((a) => a.name).join(", ") || "",
      jad_id: node.jad_id,
      depth,
      children,
    };
  }

  function buildAncestorPath(node, visited = new Set()) {
    const sources = node.source_passage || [];

    if (sources.length === 0) {
      return {
        id: node.id,
        work: node.work?.[0]?.name || "",
        author: node.work?.[0]?.author?.map((a) => a.name).join(", ") || "",
        jad_id: node.jad_id,
        depth: 0,
        children: [],
      };
    }

    const paths = sources
      .map((src) => {
        const sourceNode = idMap.get(src.id);
        if (!sourceNode || visited.has(sourceNode.id)) return null;
        visited.add(sourceNode.id);

        const subtree = buildAncestorPath(sourceNode, new Set(visited));

        return {
          ...subtree,
          children: [
            {
              id: node.id,
              work: node.work?.[0]?.name || "",
              author:
                node.work?.[0]?.author?.map((a) => a.name).join(", ") || "",
              jad_id: node.jad_id,
              depth: subtree.depth + 1,
              children: [],
            },
          ],
        };
      })
      .filter(Boolean);

    return paths.length === 1
      ? paths[0]
      : { id: null, children: paths, depth: 0 };
  }

  passages.forEach((p) => {
    p.transmission_graph = {
      id: p.id,
      descendants_tree: buildTransmissionTree(p),
      ancestors_tree: buildAncestorPath(p),
    };
  });

  const result = {};
  passages.forEach((p) => {
    result[p.id] = p.transmission_graph;
  });
  return result;
}
