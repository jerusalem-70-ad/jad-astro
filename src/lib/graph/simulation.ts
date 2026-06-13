import * as d3 from "d3";
import { forceYBounded } from "./forces";
import type { LayoutNode } from "./initializeLayout";
import type { ScaleLinear } from "d3";

export function createSimulation(
  nodes: Array<LayoutNode & { vy: number }>,
  width: number,
  yScale: ScaleLinear<number, number>,

  rScale: ScaleLinear<number, number>
) {
  return d3
    .forceSimulation<LayoutNode & { vy: number }>(nodes)
    .force("x", d3.forceX<LayoutNode & { vy: number }>(width / 2).strength(0.01))
    .force("y", d3.forceY<LayoutNode & { vy: number }>(d => d.targetY).strength(0.05))
    .force("yBound", forceYBounded(nodes, yScale))
    .force(
      "collide",
      d3.forceCollide<LayoutNode & { vy: number }>(d => rScale((d as any).degree) + 1)
        .iterations(4)
    );
}