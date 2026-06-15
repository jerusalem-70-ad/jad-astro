//prepare the graph data; need neighbourMap for related passages/nodes, what is source what target
import type { Graph } from "@/types/index";

export interface PreparedGraph {
  nodes: PreparedNode[];
  links: Graph["links"];
  nodeById: Map<string, PreparedNode>;
  neighborMap: Map<string, Set<string>>;
  ancestorsMap: Map<string, Set<string>>;
  descendantsMap: Map<string, Set<string>>;
}

export type PreparedNode = Graph["nodes"][number] & {
  degree: number;
  targetYear: number;
};

export const TIMELINE_MIN_YEAR = 90; // use 90 as min year for undated works/passages/nodes
export const TIMELINE_MAX_YEAR = 1600; // use 1600 as max year so that all nodes get plotted on the map

export function prepareGraph(graphData: Graph): PreparedGraph {
  const neighborMap = new Map<string, Set<string>>();

  graphData.nodes.forEach((d) => neighborMap.set(d.jad_id, new Set()));

  graphData.links.forEach((l) => {
    const sourceId = getSourceNodeJadId(l);
    const targetId = getTargetNodeJadId(l);

    if (!sourceId || !targetId) {
      console.warn("Link references missing node:", l);
      return;
    }

    const sourceNeighbors = neighborMap.get(sourceId);
    const targetNeighbors = neighborMap.get(targetId);

    if (!sourceNeighbors || !targetNeighbors) {
      console.warn("Missing neighbor set for link:", l);
      return;
    }

    sourceNeighbors.add(targetId);
    targetNeighbors.add(sourceId);
  });

  const nodes = graphData.nodes.map((d) => ({
    ...d,
    degree: neighborMap.get(d.jad_id)?.size ?? 0, // degree = number of unique neighbors
    targetYear:
      d.dateNotBefore != null && d.dateNotAfter != null
        ? (d.dateNotBefore + d.dateNotAfter) / 2
        : (TIMELINE_MIN_YEAR + TIMELINE_MAX_YEAR) / 2, // default to midpoint 845 of JAD timeline if no dates,
  }));

  const nodeById = new Map<string, PreparedNode>(
    nodes.map((n) => [n.jad_id, n]),
  );

  // prepare all relatives maps for quick access during hover (including indirect connections)
  const descendantsMap = new Map<string, Set<string>>(); // parent → children
  const ancestorsMap = new Map<string, Set<string>>(); // child → parents

  // initialize
  nodes.forEach((d) => {
    descendantsMap.set(d.jad_id, new Set());
    ancestorsMap.set(d.jad_id, new Set());
  });

  graphData.links.forEach((l) => {
    const sourceId = getSourceNodeJadId(l); // parent
    const targetId = getTargetNodeJadId(l); // child

    if (!sourceId || !targetId) return;

    const parentDescendants = descendantsMap.get(sourceId);
    const childAncestors = ancestorsMap.get(targetId);

    if (!parentDescendants || !childAncestors) return;

    parentDescendants.add(targetId);
    childAncestors.add(sourceId);
  });
  console.log(
    "Prepared graph with",
    nodes.length,
    "nodes and",
    graphData.links.length,
    "links",
  );
  return {
    nodes,
    links: graphData.links,
    nodeById,
    neighborMap,
    ancestorsMap,
    descendantsMap,
  };
}

export function getSourceNodeJadId(l: { source: { jad_id: string } | string }) {
  return typeof l.source === "object" ? l.source.jad_id : l.source;
}

export function getTargetNodeJadId(l: { target: { jad_id: string } | string }) {
  return typeof l.target === "object" ? l.target.jad_id : l.target;
}
