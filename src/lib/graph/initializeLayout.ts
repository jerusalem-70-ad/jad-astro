import type { PreparedNode } from "@/lib/graph/prepareGraph";
import type { ScaleLinear } from "d3";
import { TIMELINE_MAX_YEAR, TIMELINE_MIN_YEAR } from "@/lib/graph/prepareGraph";

export type LayoutNode = PreparedNode & {
  y: number;
  x: number;
  targetY: number;
  vy: number;
};
export function initializeLayout(
  nodes: PreparedNode[],
  width: number,
  yScale: ScaleLinear<number, number>,
): LayoutNode[] {
  // The one cast: the loop below gives every node its x, y and targetY
  const layoutNodes = nodes as LayoutNode[];

  layoutNodes.forEach((d) => {
    const y1 = yScale(d.dateNotBefore ?? TIMELINE_MIN_YEAR);
    const y2 = yScale(d.dateNotAfter ?? TIMELINE_MAX_YEAR);

    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    d.x = Math.random() * width;
    d.y = minY + Math.random() * (maxY - minY);
    d.targetY = yScale(d.targetYear);
    d.vy = 0;
  });

  return layoutNodes;
}
