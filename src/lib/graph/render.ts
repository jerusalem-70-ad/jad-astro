import * as d3 from "d3";
import type { LayoutNode } from "./initializeLayout";
import { scaleSqrt } from "d3-scale";
import { getSourceNodeJadId, getTargetNodeJadId } from "./prepareGraph";
import type { Graph } from "@/types";

import type { PreparedNode } from "./prepareGraph";

interface UpdateGraphArgs {
  nodeSelection: d3.Selection<
    SVGCircleElement,
    LayoutNode,
    SVGGElement,
    unknown
  >;

  linkSelection: d3.Selection<
    SVGPathElement,
    Graph["links"][number],
    SVGGElement,
    unknown
  >;

  labelSelection: d3.Selection<
    SVGTextElement,
    LayoutNode,
    SVGGElement,
    unknown
  >;

  yAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;

  nodes: LayoutNode[];

  links: Graph["links"];

  nodeById: Map<string, PreparedNode & { y: number }>;

  yAxis: d3.Axis<number>;
}

export function renderGraph({
  svg,
  nodes,
  links,
  yAxis,
  rScale,
  nodeColor,
}: {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  nodes: LayoutNode[];
  links: Graph["links"];
  yAxis: d3.Axis<number>;
  rScale: ReturnType<typeof scaleSqrt>;
  nodeColor: (d: LayoutNode) => string;
}) {
  const canvas = svg
    .append("g")
    .attr("class", "canvas")
    .attr("transform", "translate(40,0)");

  const linksGroup = canvas.append("g").attr("class", "links");
  const nodesGroup = canvas.append("g").attr("class", "nodes");
  const labelsGroup = canvas
    .append("g")
    .attr("class", "labels")
    .style("pointer-events", "none");

  const linkSelection = linksGroup
    .selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "grey")
    .attr("stroke-width", 1);

  const nodeSelection = nodesGroup
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", (d): number => rScale(d.degree))
    .attr("fill", nodeColor);

  const labelSelection = labelsGroup
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text((d) => d.name ?? String(d.id))
    .attr("font-size", 10)
    .attr("fill", "black")
    .attr("opacity", 0)
    .attr("paint-order", "stroke")
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("stroke-linejoin", "round");

  const yAxisGroup = svg
    .append("g")
    .attr("transform", "translate(10,0)")
    .call(yAxis)
    .style("font-size", "12px")
    .style("font-weight", "bold");

  yAxisGroup
    .selectAll(".tick text")
    .clone(true)
    .lower()
    .attr("stroke", "white")
    .attr("stroke-width", 8);

  return {
    canvas,
    nodeSelection,
    linkSelection,
    labelSelection,
    yAxisGroup,
  };
}

export function updateGraph({
  nodeSelection,
  linkSelection,
  labelSelection,
  yAxisGroup,
  nodes,
  links,
  nodeById,
  yAxis,
}: UpdateGraphArgs) {
  nodeSelection.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

  linkSelection.attr("d", (d) => {
    const source =
      typeof d.source === "object"
        ? d.source
        : nodeById.get(getSourceNodeJadId(d));

    const target =
      typeof d.target === "object"
        ? d.target
        : nodeById.get(getTargetNodeJadId(d));

    const x1 = source?.x ?? 0;
    const y1 = source?.y ?? 0;
    const x2 = target?.x ?? 0;
    const y2 = target?.y ?? 0;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const dr = Math.sqrt(dx * dx + dy * dy) * 0.6;
    const sweep = x1 < x2 ? 1 : 0;

    return `M${x1},${y1} A${dr},${dr} 0 0,${sweep} ${x2},${y2}`;
  });

  labelSelection.attr("x", (d) => d.x + 5).attr("y", (d) => d.y - 5);

  yAxisGroup.call(yAxis);
}
