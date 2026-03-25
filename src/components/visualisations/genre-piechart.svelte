
<script lang="ts">
import { onMount } from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store";

import GraphTitle from "@/components/visualisations/graph-title.svelte"
import {getPieChartOption} from "@/components/visualisations/helpers.ts"

let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;
let pieData: { name: string; value: number }[] = [];

//prepare data reactively using sotered filteredIds
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

  const counts = new Map<string, number>();

  passagesJson.forEach((p) => {
    const genre = p.genre;
    if (!genre) return;
    counts.set(genre, (counts.get(genre) || 0) + 1);
  });

  pieData = Array.from(counts, ([name, value]) => ({
    name,
    value
  })).sort((a, b) => a.name.localeCompare(b.name));
}


onMount(() => {
  chart = echarts.init(container);
  chart.setOption(getPieChartOption([]));
  
  const resize = () => chart?.resize();
  window.addEventListener("resize", resize);
  
  chart.on("click", (params: any) => {
    if (params.data) {
      window.location.href = withBasePath(
        `/advanced-search?JAD-temp[refinementList][work.genre][0]=${params.data.name}`
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

<GraphTitle title="Genre Distribution accross Passages" definition = "This pie chart visualizes the 
distribution of genres across all recorded passages 
        in the database. Each passage is linked to a specific work, and every work is assigned 
        to a genre, allowing the chart to aggregate passages by their generic classification. 
        The relative size of each segment reflects the number of passages associated with 
        that genre.Selecting a segment in the pie chart acts as an interactive filter: 
            clicking on a genre takes you directly to the advanced search results, where all 
            passages belonging to the chosen genre are displayed."/>
  <div
        id="genre-piechart" bind:this={container}
        class="w-full h-[900px]"
    >
  </div>
  
</div>