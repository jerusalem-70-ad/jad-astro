<script lang="ts">
import { onMount } from "svelte";
import * as d3 from "d3";
import passageGraph from "@/content/data/passage-graph.json";
import { filteredIds, selectedJadId } from "@/stores/jad_store";
import type { Graph } from "@/types/index"

let container: HTMLDivElement;

onMount(() => {



const graphData: Graph = passageGraph 
let activeFilterIds: Set<string> | null = null;
const nodeColor: string = "#6f2009"
const highlightNodeColor : string = "#a92d03"
const neighborNode : string = "#e5894a"
const linkColor: string = "#0b331b"


//a new Map for storing degree for radius and neighbours highlighting functions etc.
//--- neighbor map ---
const nodeById = new Map(
  graphData.nodes.map(n => [n.jad_id, n])
);
function getSourceNodeJadId(l: { source: { jad_id: string } | string }) {
  return typeof l.source === "object"
    ? l.source.jad_id
    : l.source;
}

function getTargetNodeJadId(l: { target: { jad_id: string } | string }) {
  return typeof l.target === "object"
    ? l.target.jad_id
    : l.target;
}
const neighborMap = new Map();

graphData.nodes.forEach(d => neighborMap.set(d.jad_id, new Set()));

graphData.links.forEach(l => {
  const sourceId = getSourceNodeJadId(l);
  const targetId = getTargetNodeJadId(l);

  if (!sourceId || !targetId) {
    console.warn("Link references missing node:", l);
    return;
  }

  neighborMap.get(sourceId).add(targetId);
  neighborMap.get(targetId).add(sourceId);
});

// degree = number of unique neighbors
graphData.nodes.forEach(d => {
  d.degree = neighborMap.get(d.jad_id).size;
});

const width = 1200;
const height = 1000;

const rScale = d3.scaleSqrt()
  .domain([0, d3.max(graphData.nodes, (d: Graph["nodes"][number]) => d.degree) ?? 0])
  .range([4, 14]);

const yScale = d3.scaleLinear()
  .domain([50,1600])
  .range([height - 5, 0]);

const yAxis = d3.axisRight(yScale)
  .ticks(10)
  .tickFormat(d3.format("d")) // remove commas 1200 instead of 1,200

// start drawing

const root = d3.select(container); 
const svg = root.append("svg")
    .attr("width", 1200)
    .attr("height", 1000);
// --- tooltip ---
const tooltip = root.append("div")
  .style("position","fixed")
  .style("background","white")
  .style("border","1px solid #999")
  .style("padding","4px 6px")
  .style("font-size","12px")
  .style("pointer-events","none")
  .style("visibility","hidden");


const canvas = svg.append("g").attr("class","canvas").attr("transform","translate(40,0)");
const linksGroup = canvas.append("g").attr("class","links");
const nodesGroup = canvas.append("g").attr("class","nodes");
const labelsGroup = canvas.append("g").attr("class","labels")
  .style("pointer-events","none"); // <- important

// initial x is random,y is average based on years
graphData.nodes.forEach(d => {
  d.x = Math.random() * width;
  const avgYear = (d.dateNotBefore + d.dateNotAfter)/2;
  d.targetY = yScale(avgYear);
});

// --- draw links ---
const links = linksGroup.selectAll("path")
  .data(graphData.links)
  .enter().append("path")
  .attr("fill","none")
  .attr("stroke","grey")
  .attr("stroke-width",1);

// --- draw nodes ---
const nodes = nodesGroup.selectAll("circle")
  .data(graphData.nodes)
  .enter().append("circle")
  .attr("r", d => rScale(d.degree))
  .attr("fill", nodeColor)
  .attr("cx", d => d.x)
  .attr("cy", d => d.y);


// --- draw labels ---
const labels = labelsGroup.selectAll("text")
  .data(graphData.nodes)
  .enter()
  .append("text")
  .attr("x", d => d.x)
  .attr("y", d => d.y)
  .text(d => d.name ?? d.id)
  .attr("font-size", 10)
  .attr("fill", "black")
  .attr("pointer-events", "none")
  .attr("opacity", 0)
  .attr("paint-order", "stroke")
  .attr("stroke", "white")
  .attr("stroke-width", 3)
  .attr("stroke-linejoin", "round");

  // -- draw yaxis with year after nodes to be on top visible
const yAxisGroup = svg.append("g")
  .attr("transform","translate(10,0)")
  .call(yAxis);

yAxisGroup.selectAll(".tick text")
  .clone(true)
  .lower()
  .attr("style", "background-color: green")
  .attr("stroke", "white")
  .attr("stroke-width", 3);

// --- hover ---

let tooltipEl;

nodes.on("mouseenter", function(event,d){
 tooltip.style("visibility","visible")
   .html(`<strong>#${d.id} ${d.name ?? ""}</strong><br/>
          <span>Year: ${d.dateNotBefore} - ${d.dateNotAfter}</span><br/>
                   <span>Related passages: ${d.degree || 0}</span>`);

  tooltipEl = this;
  updateTooltipPosition();
  highlightNode(d);
  

  const neighbors = neighborMap.get(d.jad_id) || new Set();
  labels
    .attr("opacity", n => neighbors.has(n.jad_id) ? 1 : 0)
    .each(function(n){
      if(neighbors.has(n.jad_id)) this.parentNode.appendChild(this);
    });

})


.on("mouseleave", () => {
  resetHighlight();
   tooltip.style("visibility", "hidden");
  labels.attr("opacity",0);
})
//not using on click, cause of stupid chrome 
// nodes are moving? not the same pixel during click
// better use pointerdown, but with delay so that one can drag the graph without accidental clicks
let downTime = 0;

nodes
  .on("pointerdown", function (event, d) {
    downTime = Date.now();
  })
  .on("pointerup", function (event, d) {
    if (Date.now() - downTime < 200) {
      console.log("Click-like interaction", d);
      selectedJadId.set(d.jad_id);
    }
  });

svg.on("pointerdown", () => {
  selectedJadId.set(null),
  resetHighlight();
})


// --- force simulation ---
const simulation = d3.forceSimulation<Graph["nodes"][number]>(graphData.nodes)
  .force("x", d3.forceX(width/2).strength(0.01))
  .force("y", d3.forceY((d: Graph["nodes"][number]) => d.targetY).strength(0.1))
  .force("collide", d3.forceCollide((d: Graph["nodes"][number]) => rScale(d.degree)+4).iterations(3))
  .force("link", d3.forceLink(graphData.links).id((d: d3.SimulationNodeDatum) => (d as Graph["nodes"][number]).jad_id).distance(40)) 
  .on("tick", () => {
    const yearMargin = 40;
    const pixelMargin = Math.abs(yScale(0)-yScale(yearMargin));
    nodes
      .attr("cx", d => d.x)
      .attr("cy", d => {
        const minY = d.targetY - pixelMargin;
        const maxY = d.targetY + pixelMargin;
        if (d.y < minY) d.y += (minY - d.y) * 0.2;
        if (d.y > maxY) d.y -= (d.y - maxY) * 0.2;
        return d.y;
      });

    links.attr("d", d => {
      const source = typeof d.source === "object" ? d.source : nodeById.get(d.source);
      const target = typeof d.target === "object" ? d.target : nodeById.get(d.target);
      const x1 = source?.x ?? 0, y1 = source?.y ?? 0, x2 = target?.x ?? 0, y2 = target?.y ?? 0;
      const dx = x2 - x1, dy = y2 - y1;
      const dr = Math.sqrt(dx * dx + dy * dy) * 0.6;
      const sweep = x1 < x2 ? 1 : 0;
      return `M${x1},${y1} A${dr},${dr} 0 0,${sweep} ${x2},${y2}`;
    });

    labels.attr("x", d => d.x+5).attr("y", d => d.y-5);

      // fast-forward simulation
      simulation.tick(10);
    });



// --- zoom ---
const zoom = d3.zoom().scaleExtent([0.5,8]).on("zoom", event => {
  canvas.attr("transform", event.transform); //redraws nodes and links
  const newY = event.transform.rescaleY(yScale); // get new value for the scale on the y axis

      yAxisGroup.call(
        d3.axisRight(newY)
          .ticks(10)
          .tickFormat((domainValue) => typeof domainValue === "number" ? d3.format("d")(domainValue) : String(domainValue))
      ); //redraws axis with ticks 
});

svg.call(zoom as any);

// connect to store for filteredID

filteredIds.subscribe((ids) => {
  if (!ids || ids.size === 0 || ids.size === graphData.nodes.length) {
    activeFilterIds = null;
    resetHighlight();
    return;
  }
  activeFilterIds = ids;
  console.log("Graph received ids:", ids);
  highlightNodesByIds(ids);
});


// --- helpers ---
//highlight on mouse over
function highlightNode(d: Graph["nodes"][number]){
  const neighbors = neighborMap.get(d.jad_id) ?? new Set();
   nodes
    .attr("fill", n => {
      if (n.id === d.id) return highlightNodeColor;
      if (neighbors.has(n.jad_id)) return neighborNode;

      if (activeFilterIds) {
        return activeFilterIds.has(n.jad_id) ? nodeColor : "#ccc";
      }

      return "#ccc";
    })
    .attr("opacity", n => {
      if (n.id === d.id || neighbors.has(n.jad_id)) return 1;
      if (activeFilterIds) return activeFilterIds.has(n.jad_id) ? 1 : 0.15;
      return 0.2;
    })
    .attr("r", n =>
      n.id === d.id ? rScale(n.degree) * 1.5 : rScale(n.degree)
    );
  links.attr("stroke", l => getSourceNodeJadId(l) ===d.jad_id || getTargetNodeJadId(l)===d.jad_id ? linkColor : "#ccc")
       .attr("stroke-opacity", l => getSourceNodeJadId(l) ===d.jad_id || getTargetNodeJadId(l)===d.jad_id ? 1:0.2);
}
function resetHighlight(){
 
  nodes
    .attr("fill", nodeColor)
    .attr("opacity",1)
    .attr("r", d => rScale(d.degree));

  links
    .attr("stroke", linkColor)
    .attr("stroke-opacity",1);
  if (activeFilterIds) {
    highlightNodesByIds(activeFilterIds);
  }
}

function highlightNodesByIds(ids: Set<string>) {

  nodes
    .attr("fill", d => ids.has(d.jad_id) ? highlightNodeColor : nodeColor)
    .attr("opacity", d => ids.has(d.jad_id) ? 1 : 0.15);
// highlight only links which have both source and target in the ids set
  links
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
// need to get the position based on node
function updateTooltipPosition() {
  if (!tooltipEl) return;

  const rect = tooltipEl.getBoundingClientRect();

  tooltip
    .style("left", rect.x + rect.width / 2 + 5 + "px")
    .style("top", rect.y + "px");
}

});
</script>


<div class="m-1 w-full">
  <div id="graph-container" bind:this={container}></div>
</div>
