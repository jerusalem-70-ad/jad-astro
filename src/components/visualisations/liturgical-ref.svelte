<script lang="ts">
import {onMount} from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store.ts";
import GraphContainer from "@/components/visualisations/graph-container.svelte"
import GraphTitle from "@/components/visualisations/graph-title.svelte";
import {getPieChartOption} from "@/components/visualisations/helpers.ts"

export let mode: "card" | "featured" = "featured";
let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;
let pieData: { name: string; value: number }[] = [];
let passageCount = 0
    // Prepare chartdata check if filteredIDs else use passages
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;
    const liturgicalCounts = new Map();
passageCount = passagesJson.length
    passagesJson.forEach((passage) => {
    const refs = [...new Set((passage.liturgical_references ?? []))];

    if (refs.length === 0) return;

    refs.forEach((ref) => {
        liturgicalCounts.set(ref, (liturgicalCounts.get(ref) || 0) + 1);
    });
    });

    pieData = Array.from(liturgicalCounts, ([name, value]) => ({ name, value })).sort((a,b) => a.value - b.value);
}

onMount(() => {
  chart = echarts.init(container);
  chart.setOption(getPieChartOption([], "references", 0, mode));

   if (mode === "featured") {
      chart.on("click", (params: any) => {
        if (params.data) {
          window.location.href = withBasePath(
            `/advanced-search?JAD-temp[refinementList][liturgical_references.value][0]=${params.data.name}`
            );
        }
      });
    }
  const resize = () => chart?.resize();
  window.addEventListener("resize", resize);
  

   return () => {
    window.removeEventListener("resize", resize);
    chart?.dispose();
  };
});

$: if (chart) {
  chart.setOption(getPieChartOption(pieData, "references", passageCount, mode));
}




</script>

<div class="bg-white border rounded-md shadow-sm p-4">

  <GraphTitle {mode} title="Liturgical references" what = "Explore the distribution of passages accross the liturgical year."
how="Multiple references to the same liturgical occassion within a single passage are counted as one.
Select a segment to see the results in the advanced search."
why="Search for patterns and dependencies between liturgical occasions and keywords / authors / places ... "
questions="When was a particular theme (e.g. keyword 'Martyrdom') discussed?"/>
   
    <div
        id="liturgical-piechart" bind:this={container}
        class={mode === "featured" ? "w-full h-225": "h-40 w-full"}

    >
  </div>
</div>
