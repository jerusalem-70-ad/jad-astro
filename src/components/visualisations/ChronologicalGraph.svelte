<script lang="ts">
import GraphContainer from "@/components/visualisations/graph-container.svelte"
import GraphTitle from "@/components/visualisations/graph-title.svelte";
import { filteredIds, selectedJadId, dataPassagesGraph } from "@/stores/jad_store.ts";

import { onMount } from "svelte";
import * as d3 from "d3";

import graphData from "@/content/data/passage-graph.json";

$dataPassagesGraph = graphData;

import { prepareGraph,getSourceNodeJadId, getTargetNodeJadId } from "@/lib/graph/prepareGraph";
import { initializeLayout } from "@/lib/graph/initializeLayout";
import { createSimulation } from "@/lib/graph/simulation";
import { renderGraph, updateGraph } from "@/lib/graph/render";
import {getLineageSet} from "@/lib/graph/lineage"

let container: HTMLDivElement;
let prepared;
let graph;
let tooltip;
let tooltipEl: SVGCircleElement | null = null;

let activeFilterIds: Set<string> | null = null;

    // state for nodes when clicked to introduce a freeze state
let lockedNode = null;

const nodeColor: string = "#6f2009"
const filteredColor: string ="#86705f"
const highlightNodeColor : string = "#a92d03"
const neighborNode : string = "#e5894a"
const linkColor: string = "#0b331b"

// helpers for interaction
//highlight on mouse over
function highlightNode(d) {

  const allRelatives = getLineageSet(
    d.jad_id,
    prepared.ancestorsMap,
    prepared.descendantsMap
  );

  graph.nodeSelection
    .attr("fill", (n) => {
      if (n.id === d.id) {
        return highlightNodeColor;
      }
      if (allRelatives.has(n.jad_id)) {
        return neighborNode;
      }
      if (activeFilterIds) {
        return activeFilterIds.has(n.jad_id)
          ? filteredColor
          : "#ccc";
      }
      return "#ccc";
    })
    .attr("opacity", (n) => {
      if (
        n.id === d.id ||
        allRelatives.has(n.jad_id)
      ) {
        return 1;
      }
      if (activeFilterIds) {
        return activeFilterIds.has(n.jad_id)
          ? 1
          : 0.15;
      }
      return 0.2;
    })

  graph.linkSelection
    .attr("stroke", (l) => {

      const s = getSourceNodeJadId(l);
      const t = getTargetNodeJadId(l);

      return (
        allRelatives.has(s) &&
        allRelatives.has(t)
      )
        ? linkColor
        : "#ccc";
    })
    .attr("stroke-opacity", (l) => {

      const s = getSourceNodeJadId(l);
      const t = getTargetNodeJadId(l);

      return (
        allRelatives.has(s) &&
        allRelatives.has(t)
      )
        ? 1
        : 0.2;
    });
    graph.labelSelection
      .attr("opacity", n => allRelatives.has(n.jad_id) ? 1 : 0)
        .each(function(n){
        if (allRelatives.has(n.jad_id)) this.parentNode.appendChild(this);
        });
}

// need to get the position based on node
function updateTooltipPosition() {
  if (!tooltipEl) return;

  const rect = tooltipEl.getBoundingClientRect();

  tooltip
    .style("left", rect.x + rect.width / 2 + 5 + "px")
    .style("top", rect.y + "px");
}

// show tooltip on hover, click, neighbours and links remain
function showNodeTooltip(d, el) {
const neighbors = getLineageSet(
  d.jad_id,
  prepared.ancestorsMap,
  prepared.descendantsMap
);
  tooltip
    .style("visibility", "visible")
    .html(`
      <strong>#${d.id} ${d.name ?? ""}</strong><br/>
      <span>Year: ${d.dateNotBefore} - ${d.dateNotAfter}</span><br/>
      <span>Immediately related passages: ${d.degree || 0}</span><br/>
      <span>All related passages: ${neighbors.size -1 || 0}</span>

    `);

  tooltipEl = el;

  updateTooltipPosition();

  highlightNode(d);
}

function showNodeDetails(d, el) {
    tooltip
.style("visibility", "hidden");
  highlightNode(d);

 const neighbors = getLineageSet(
  d.jad_id,
  prepared.ancestorsMap,
  prepared.descendantsMap
);

  graph.labelSelection
  .attr("opacity", n => {
    const isNeighbor = neighbors.has(n.jad_id);
    const isSelf = n.jad_id === d.jad_id;
    return (isNeighbor || isSelf) ? 1 : 0;
  })
  .each(function(n){
    if (neighbors.has(n.jad_id) || n.jad_id === d.jad_id) {
      this.parentNode.appendChild(this);
    }
  });
}

function highlightNodesByIds(ids: Set<string>) {

  graph.nodeSelection
    .attr("fill", d => ids.has(d.jad_id) ? highlightNodeColor : nodeColor)
    .attr("opacity", d => ids.has(d.jad_id) ? 1 : 0.15);
// highlight only links which have both source and target in the ids set
  graph.linkSelection
    .attr("stroke", l =>
      ids.has(getTargetNodeJadId(l)) && ids.has(getSourceNodeJadId(l))
        ? linkColor
        : "#ccc"
    )
    .attr("stroke-opacity", l =>
      ids.has(getTargetNodeJadId(l)) && ids.has(getSourceNodeJadId(l))
        ? 0.5
        : 0.1
    );
}

function resetHighlight(){
 
  graph.nodeSelection
    .attr("fill", nodeColor)
    .attr("opacity",1)
    
  graph.linkSelection
    .attr("stroke", linkColor)
    .attr("stroke-opacity",1);
  if (activeFilterIds) {
    highlightNodesByIds(activeFilterIds);
  }
}

onMount(() => {
  // --------------------
  // graph preparation
  // --------------------

  prepared = prepareGraph(graphData);

  // --------------------
  // dimensions
  // --------------------

  const width = container.clientWidth;
const height = width;
  // --------------------
  // scales
  // --------------------

  const rScale = d3.scaleSqrt()
    .domain([0, d3.max(prepared.nodes, d => d.degree) ?? 0])
    .range([4, 14]);

  const yScale = d3.scaleLinear()
    .domain([50, 1600])
    .range([height - 5, 0]);

  const yAxis = d3.axisRight(yScale)
    .ticks(10)
    .tickFormat(d3.format("d"));

  // --------------------
  // initialize layout
  // --------------------

  initializeLayout(
    prepared.nodes,
    width,
    yScale
  );

  // --------------------
  // create svg
  // --------------------

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", "auto");

  // --------------------
  // render graph
  // --------------------

  graph = renderGraph({
    svg,
    nodes: prepared.nodes,
    links: graphData.links,
    yAxis,
    rScale,
    nodeColor: "#6f2009"
  });

  const zoom = d3
  .zoom()
  .scaleExtent([0.5, 8])
  .on("zoom", (event) => {

    graph.canvas.attr(
      "transform",
      event.transform
    );

    const newY =
      event.transform.rescaleY(yScale);

    graph.yAxisGroup.call(
      d3.axisRight(newY)
        .ticks(10)
        .tickFormat(d3.format("d"))
    );
  });

svg.call(zoom as any);

  // draw the tooltip
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

  // interactions:
  // on hover highlight node + related, show node's tooltip and relateds labels
graph.nodeSelection
  .on("mouseenter", function(event, d) {
    // allow tooltip only for locked node and its relatives
    if (lockedNode) {
      const allowedNodes = Array.from(
        getLineageSet(
          lockedNode.jad_id,
          prepared.ancestorsMap,
          prepared.descendantsMap
        )
      );
      if (allowedNodes.includes(d.jad_id)) {
        showNodeTooltip(d, this);
      
      } 
      return; // stop here when locked
    } else {
    showNodeTooltip(d, this);}
  })
  .on("mouseleave", () => {
    if (lockedNode) {
       showNodeDetails(lockedNode, this);;
    }   // when locked return to locked nodes details and relatives
else {
      resetHighlight();
      tooltip.style("visibility", "hidden");
      graph.labelSelection.attr("opacity", 0);
    }
    
  });
let downTime = 0;

// on click - 
  graph.nodeSelection
  .on("pointerdown", (event) => {
    event.stopPropagation();
    downTime = Date.now();
  })
  .on("pointerup", function(event, d) {
  event.stopPropagation();

  if (Date.now() - downTime < 200) {
    if (!lockedNode) {
      // first click → lock
      lockedNode = d;
      showNodeDetails(d, this);
      //showNodeTooltip(d, this)

    } else if (lockedNode.jad_id === d.jad_id) {
      // second click on SAME node → open dialog
      selectedJadId.set(d.jad_id);

    } else {
      // clicked a DIFFERENT node → switch lock
      lockedNode = d;
      showNodeDetails(d, this);
    }
  }

  // reset on click outside node
  svg.on("pointerdown", () => {
  lockedNode = null;   //  unlock

  resetHighlight();
  tooltip.style("visibility", "hidden");
  graph.labelSelection.attr("opacity", 0);
});
});
  
  // --------------------
  // simulation
  // --------------------

  const simulation = createSimulation(
    prepared.nodes,
    width,
    yScale,
    rScale
  );

  simulation.on("tick", () => {
    updateGraph({
      ...graph,
      nodes: prepared.nodes,
      links: graphData.links,
      nodeById: prepared.nodeById,
      yAxis
    });
     updateTooltipPosition();
  });

  // connect to store

  const unsubscribe = filteredIds.subscribe((ids) => {
  if (
    !ids ||
    ids.size === 0 ||
    ids.size === prepared.nodes.length
  ) {
    activeFilterIds = null;

    //resetHighlight(graph);

    return;
  }

  activeFilterIds = ids;

  console.log("Graph received ids:", ids);

  highlightNodesByIds(ids);
});

});
</script>
<div class="grid gap-2 p-3 ">
<GraphContainer>
<GraphTitle title="Chronological graph" 
what = "Displays all passages in chronological order. Node size reflects the level of connectedness, 
while links indicate source relationships and derivative passages."
how="Hover over a particular passage to highlight 
its relations. Single click to freeze the graph. A second click brings you to the dialog for the detailed view page 
of the selected passage. Combine the filters to make a selection of passages."
why="Provides a bird's-eye view of the entire data set."
questions="How widely used was passage X?"
/>
 
  <div id="graph-container" bind:this={container}></div>
  </GraphContainer>
</div>