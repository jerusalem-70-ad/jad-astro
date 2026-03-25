<script lang="ts">
import {onMount} from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store";

import GraphTitle from "@/components/visualisations/graph-title.svelte";
import {getPieChartOption} from "@/components/visualisations/helpers.ts"

let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;
let pieData: { name: string; value: number }[] = [];

    // Prepare chartdata check if filteredIDs else use passages
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;
    const liturgicalCounts = new Map();

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
  chart.setOption(getPieChartOption([]));
  
  const resize = () => chart?.resize();
  window.addEventListener("resize", resize);
  
 chart.on("click", function (params: any) {
        if (params.data) {
            window.location.href = withBasePath(
            `/advanced-search?JAD-temp[refinementList][liturgical_references.value][0]=${params.data.name}`
            );
        }
        });

   return () => {
    window.removeEventListener("resize", resize);
    chart?.dispose();
  };
});

$: if (chart) {
  chart.setOption({
    legend: {
      formatter: (name: string) => {
        const item = pieData.find(d => d.name === name);
        return item ? `${name} (${item.value})` : name;
      }
    },
    series: [
      {
        data: pieData
      }
    ]
  });
}



</script>

<div class="grid gap-2 p-3 ">

<GraphTitle title="Liturgical references" definition = "The pie chart illustrate the frequency of liturgical references 
across the passages. Multiple references to the same liturgical occassion within a single passage are counted as one.
Selecting a segment in the pie chart acts as an interactive filter leading  you directly to the advanced search results."/>
   
    <div
        id="liturgical-piechart" bind:this={container}
        class="w-full h-[900px]"
    >
  </div>
</div>
