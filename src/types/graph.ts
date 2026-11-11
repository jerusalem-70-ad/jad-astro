// types/graph.ts
import type { Selection } from "d3";
import type { Graph } from "@/types/index";
import type { LayoutNode } from "@/lib/graph/initializeLayout";

export type GraphNode = Graph["nodes"][number];
export type GraphLink = Graph["links"][number];

// What renderGraph() returns, as far as the component uses it
export interface GraphHandles {
  nodeSelection: Selection<SVGCircleElement, LayoutNode, any, any>;
  linkSelection: Selection<SVGPathElement, GraphLink, any, any>;
  labelSelection: Selection<SVGTextElement, LayoutNode, any, any>;
  canvas: Selection<SVGGElement, unknown, any, any>;
  leftAxisGroup: Selection<SVGGElement, unknown, any, any>;
  rightAxisGroup: Selection<SVGGElement, unknown, any, any>;
}
