/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Add global window extensions for the graph data
interface Window {
  passageGraphData?: {
    nodes: Array<{
      id: string | number;
      jad_id: string;
      name: string;
      work: string;
      author: string;
      passage: string;
      depth: number;
      nodeType: "current" | "ancestor" | "descendant" | "regular";
      children: any[];
    }>;
    links: Array<{
      source: string | number;
      target: string | number;
      depth: number;
    }>;
  };
  passageGraphConfig?: {
    showLegend: boolean;
    enableZoom: boolean;
    enableNavigation: boolean;
  };
  debugGraphRendering?: boolean;
}
