<script lang="ts">
  import GraphTitle from "@/components/visualisations/graph-title.svelte";
  import { filteredIds, selectedJadId, dataPassagesGraph } from "@/stores/jad_store.ts";
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import graphData from "@/content/data/passage-graph.json";
  import type { Graph } from "@/types/index";
import type { GraphLink, GraphHandles, GraphNode } from "@/types/graph";
import type { PreparedGraph } from "@/lib/graph/prepareGraph";
import type { LayoutNode } from "@/lib/graph/initializeLayout";

  import { prepareGraph, getSourceNodeJadId, getTargetNodeJadId } from "@/lib/graph/prepareGraph";
  import { initializeLayout } from "@/lib/graph/initializeLayout";
  import { createSimulation } from "@/lib/graph/simulation";
  import { renderGraph, updateGraph } from "@/lib/graph/render";
  import { getLineageSet } from "@/lib/graph/lineage";

import ChartNetwork from "@lucide/svelte/icons/chart-network";

  export let mode: "card" | "featured" = "featured";

  // JSON imports are typed from their content, so tell TS what they really are
const data = graphData as unknown as Graph;   // replaces the RawGraph cast
$dataPassagesGraph = data;

  let container: HTMLDivElement;
  let prepared: PreparedGraph | null = null;
  let graph: GraphHandles | null = null;
  let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;
  let tooltipEl: SVGCircleElement | null = null;
  let lockedNode: LayoutNode | null = null;
  let activeFilterIds: Set<string> | null = null;

  const totalPassages = data.nodes.length;
  let allFilteredNodes = totalPassages; // shows everything when no filter is active
  let falseDatePassages = 0;

  const nodeColor = "#6f2009";
  const filteredColor = "#86705f";
  const highlightNodeColor = "#a92d03";
  const neighborNode = "#e5894a";
  const linkColor = "#0b331b";

  function lineageOf(d: { jad_id: string }): Set<string> {
    return getLineageSet(d.jad_id, prepared!.ancestorsMap, prepared!.descendantsMap);
  }

  function highlightNode(d: LayoutNode) {
    if (!graph || !prepared) return;
    const relatives = lineageOf(d);

    graph.nodeSelection
      .attr("fill", (n) => {
        if (n.id === d.id) return highlightNodeColor;
        if (relatives.has(n.jad_id)) return neighborNode;
        if (activeFilterIds) return activeFilterIds.has(n.jad_id) ? filteredColor : "#ccc";
        return "#ccc";
      })
      .attr("opacity", (n) => {
        if (n.id === d.id || relatives.has(n.jad_id)) return 1;
        if (activeFilterIds) return activeFilterIds.has(n.jad_id) ? 1 : 0.15;
        return 0.2;
      });

    const inLineage = (l: GraphLink) =>
      relatives.has(getSourceNodeJadId(l)) && relatives.has(getTargetNodeJadId(l));

    graph.linkSelection
      .attr("stroke", (l) => (inLineage(l) ? linkColor : "#ccc"))
      .attr("stroke-opacity", (l) => (inLineage(l) ? 1 : 0.2));

    graph.labelSelection
      .attr("opacity", (n) => (relatives.has(n.jad_id) ? 1 : 0))
      .each(function (n) {
        if (relatives.has(n.jad_id)) this.parentNode?.appendChild(this);
      });
  }

  function updateTooltipPosition() {
    if (!tooltipEl || !tooltip) return;
    const rect = tooltipEl.getBoundingClientRect();
    tooltip
      .style("left", rect.x + rect.width / 2 + 5 + "px")
      .style("top", rect.y + "px");
  }

  function showNodeTooltip(d: LayoutNode, el: SVGCircleElement) {
    if (!tooltip || !prepared) return;
    const neighbors = lineageOf(d);
    tooltip.style("visibility", "visible").html(`
      <strong>#${d.id} ${d.name ?? ""}</strong><br/>
      <span>Year: ${d.dateNotBefore} - ${d.dateNotAfter}</span><br/>
      <span>Immediately related passages: ${d.degree || 0}</span><br/>
      <span>All related passages: ${neighbors.size - 1 || 0}</span>
    `);
    tooltipEl = el;
    updateTooltipPosition();
    highlightNode(d);
  }

  function showNodeDetails(d: LayoutNode) {
    if (!graph || !prepared) return;
    tooltip?.style("visibility", "hidden");
    highlightNode(d); // this already shows the labels of the lineage
  }

  function highlightNodesByIds(ids: Set<string>) {
    if (!graph) return;
    graph.nodeSelection
      .attr("fill", (d) => (ids.has(d.jad_id) ? highlightNodeColor : nodeColor))
      .attr("opacity", (d) => (ids.has(d.jad_id) ? 1 : 0.15));

    const bothIn = (l: GraphLink) =>
      ids.has(getTargetNodeJadId(l)) && ids.has(getSourceNodeJadId(l));

    graph.linkSelection
      .attr("stroke", (l) => (bothIn(l) ? linkColor : "#ccc"))
      .attr("stroke-opacity", (l) => (bothIn(l) ? 0.5 : 0.1));
  }

  function resetHighlight() {
    if (!graph) return;
    graph.nodeSelection.attr("fill", nodeColor).attr("opacity", 1);
    graph.linkSelection.attr("stroke", linkColor).attr("stroke-opacity", 1);
    if (activeFilterIds) highlightNodesByIds(activeFilterIds);
  }

  onMount(() => {
    // The count in the title is needed in BOTH modes, so subscribe first
    const unsubscribe = filteredIds.subscribe((ids) => {
      if (!ids || ids.size === 0 || ids.size === totalPassages) {
        activeFilterIds = null;
        allFilteredNodes = totalPassages;
        falseDatePassages = 0;
        if (graph) resetHighlight();
        return;
      }
      activeFilterIds = ids;
      allFilteredNodes = data.nodes.filter((n) => ids.has(n.jad_id)).length;
      falseDatePassages = ids.size - allFilteredNodes;
      highlightNodesByIds(ids);
    });

    // Card: only title and count. No d3, no simulation.
    if (mode === "card") return unsubscribe;

    // ---------- featured: build the graph ----------
    prepared = prepareGraph(data);
    const width = container.clientWidth;
    const height = width;

    const rScale = d3
      .scaleSqrt()
      .domain([0, d3.max(prepared.nodes, (d) => d.degree ?? 0) ?? 0])
      .range([4, 14]);

    const yScale = d3.scaleLinear().domain([50, 1600]).range([height - 5, 0]);

    initializeLayout(prepared.nodes, width, yScale);
    const layoutNodes = initializeLayout(prepared.nodes, width, yScale);
    const layoutById = new Map(layoutNodes.map((n) => [n.jad_id, n]));

    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");


  graph = renderGraph({ svg, nodes: layoutNodes, links: data.links, width, yScale, rScale, nodeColor });


    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        graph!.canvas.attr("transform", `translate(40,0) ${event.transform}`);
        const newY = event.transform.rescaleY(yScale);
        graph!.leftAxisGroup.call(d3.axisRight(newY).ticks(10).tickFormat(d3.format("d")));
        graph!.rightAxisGroup.call(d3.axisLeft(newY).ticks(10).tickFormat(d3.format("d")));
      });
    svg.call(zoom);

    tooltip = d3
      .select(container)
      .append("div")
      .style("position", "fixed")
      .style("background", "white")
      .style("border", "1px solid #999")
      .style("padding", "4px 6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("visibility", "hidden");

    // `function` (not an arrow) so that `this` is the DOM element
    graph.nodeSelection
      .on("mouseenter", function (_event, d) {
        if (lockedNode) {
          if (lineageOf(lockedNode).has(d.jad_id)) showNodeTooltip(d, this);
          return;
        }
        showNodeTooltip(d, this);
      })
      .on("mouseleave", () => {
        if (lockedNode) {
          showNodeDetails(lockedNode);
        } else {
          resetHighlight();
          tooltip?.style("visibility", "hidden");
          graph?.labelSelection.attr("opacity", 0);
        }
      });

    let downTime = 0;
    graph.nodeSelection
      .on("pointerdown", (event: PointerEvent) => {
        event.stopPropagation();
        downTime = Date.now();
      })
      .on("pointerup", (event: PointerEvent, d) => {
        event.stopPropagation();
        if (Date.now() - downTime >= 200) return; // a drag, not a click
        if (lockedNode && lockedNode.jad_id === d.jad_id) {
          selectedJadId.set(d.jad_id); // second click on the same node: open the dialog
        } else {
          lockedNode = d; // first click, or a different node: lock it
          showNodeDetails(d);
        }
      });

svg.call(zoom);
svg.on("dblclick.zoom", null); // d3-zoom zooms in on double-click by default, so turn that off

// Double-click on the background: unlock
svg.on("dblclick", (event: MouseEvent) => {
  // Ignore double-clicks on nodes. The second click on a node opens the dialog,
  if ((event.target as Element).closest("circle")) return;

  lockedNode = null;
  resetHighlight();
  tooltip?.style("visibility", "hidden");
  graph?.labelSelection.attr("opacity", 0);
});


    const simulation = createSimulation(layoutNodes, width, yScale, rScale);
    simulation.on("tick", () => {
      updateGraph({
        ...graph!,
        nodes: layoutNodes,
        links: data.links,
        nodeById: layoutById,
      });
      updateTooltipPosition();
    });

    // Apply a filter that was already active before the graph existed
    if (activeFilterIds) highlightNodesByIds(activeFilterIds);

    return () => {
      unsubscribe();
      simulation.stop();
      svg.remove();
      tooltip?.remove();
    };
  });
</script>

{#if mode === "card"}
  <div class="bg-white border rounded-md shadow-sm p-4">
    <GraphTitle {mode} title="Chronological graph" what="..." how="..." why="..." questions="..." />
    <p class="text-xs text-neutral-600">Showing {allFilteredNodes} from {totalPassages} passages</p>
      <ChartNetwork class="m-auto h-24 w-24 text-brand-650" aria-hidden="true" />
  </div>
{:else}
  <div class="max-h-[calc(100vh-12rem)] overflow-y-auto rounded-md border bg-white p-4 shadow-sm">
    <GraphTitle {mode} title="Chronological graph" what="..." how="..." why="..." questions="..." />
    <div class="p-2 text-center text-base leading-none font-medium text-gray-700">
      Showing {allFilteredNodes} from {totalPassages} passages
      {falseDatePassages > 0 ? `[for ${falseDatePassages} passages no date to plot]` : ""}
    </div>
    <div id="graph-container" bind:this={container}></div>
  </div>
{/if}