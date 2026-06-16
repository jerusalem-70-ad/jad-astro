// custom force to keep nodes within the dates bound on the y axis
import type { LayoutNode } from "@/lib/graph/initializeLayout";
import { TIMELINE_MAX_YEAR, TIMELINE_MIN_YEAR } from "@/lib/graph/prepareGraph";

import type { ScaleLinear } from "d3";

export function forceYBounded(
  nodes: LayoutNode[] & { vy: number }[],
  yScale: ScaleLinear<number, number>,
) {
  return function (alpha: number) {
    for (const d of nodes) {
      const minY = yScale(d.dateNotAfter ?? TIMELINE_MAX_YEAR);
      const maxY = yScale(d.dateNotBefore ?? TIMELINE_MIN_YEAR);

      if (d.y < minY) {
        d.vy += (minY - d.y) * 0.2 * alpha;
      }

      if (d.y > maxY) {
        d.vy -= (d.y - maxY) * 0.2 * alpha;
      }
    }
  };
}
