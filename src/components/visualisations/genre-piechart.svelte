
<script lang="ts">
import { onMount } from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store";
import GraphContainer from "@/components/visualisations/graph-container.svelte"
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
<GraphContainer>
<GraphTitle title="Genre Distribution accross Passages" 
 what = "Pie chart for the distribution of genres across passages."
  how = "Use the filters to make a selection of passages. The chart shows the genres of 
  the filtered passages. Select a segment to see the results in the advanced search."
  why = "Find patterns and corelations between genre - place - time."
  questions = "Which genres are more often related with a specific keyword, place or time of 
  composition of the passage?"/>
  <div
        id="genre-piechart" bind:this={container}
        class="w-full h-[900px]"
    >
  </div>
  </GraphContainer>
</div>