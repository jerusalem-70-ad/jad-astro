<script lang="ts">
import graphData from "@/content/data/passage-graph.json";
import {dataPassagesGraph} from "@/stores/jad_store";

    import prepareGraph from "@/lib/graph/prepareGraph"
    import initializeLayout from "@/lib/graph/initializeLayout"
    import getLineageSet from "@/lib/graph/lineage.ts"
    import forceYBounded from "@/lib/graph/forces.ts"
    import createSimulation from "@/lib/graph/simulaation.ts"
    import renderGraph from "@/lib/graph/render.ts"
    import updateGraph from "@/lib/graph/render.ts"


let container: HTMLDivElement;

const prepared = prepareGraph(graphData);

initializeLayout(
  prepared.nodes,
  width,
  yScale
);

const graph = renderGraph({
  svg,
  nodes,
  links,
  yAxis,
  rScale,
  nodeColor,
});

simulation.on("tick", () => {
  updateGraph({
    ...graph,
    nodes,
    links,
    nodeById,
    yAxis,
  });
});
simulation.on("tick", () => {
  updateGraph({
    nodeSelection,
    linkSelection,
    labelSelection
  });
});


</script>


<div class="grid gap-2 p-3 ">
<GraphContainer>
<GraphTitle title="Chronological graph" 
what = "Displays all passages in chronological order. Node size reflects the level of connectedness, 
while links indicate source relationships and derivative passages."
how="Hover over a particular passage to highlight 
its relations. Single click to freeze the graph. A second click brings you to the detailed view page 
of the selected passage. Use the filter to make a selection of passages."
why="Provides a bird's-eye view of the entire data set."
questions="How widely used was passage X? "
/>
 
  <div id="graph-container" bind:this={container}></div>
  </GraphContainer>
</div>
