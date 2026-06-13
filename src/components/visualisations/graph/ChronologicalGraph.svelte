<script lang="ts">
    import prepareGraph from "@/lib/graph/prepareGraph"
    import initializeLayout from "@/lib/graph/initializeLayout"
    import getLineageSet from "@/lib/graph/lineage.ts"
    import forceYBounded from "@/lib/graph/forces.ts"
    import createSimulation from "@/lib/graph/simulaation.ts"
</script>

const prepared = prepareGraph(graphData);

initializeLayout(
  prepared.nodes,
  width,
  yScale
);