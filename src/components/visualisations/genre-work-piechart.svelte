
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


//prepare data reactively using sorted filteredIds
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

  // prepare works Map from all passages

// need first to group by work-title
const worksMap = new Map();

passagesJson.forEach((p) => {
  const work = p.title.split("(")[0].trim();
  if (!work) return;

  const genre = p.genre || "Unknown Genre";
 
  if (!worksMap.has(work)) {
    worksMap.set(work, genre);
  }
});

const genreCounts = new Map();

worksMap.forEach((genre) => {
  genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
});

pieData = Array.from(genreCounts, ([name, value]) => ({
  name,
  value
}))
console.log("worksMap", worksMap);
console.log("genreCounts", genreCounts);
console.log("pieData", pieData);
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
<div class="grid gap-2 p-3">
 <GraphContainer>
  <GraphTitle title="Genre Distribution accross Works" definition = "This pie chart visualizes the 
  distribution of genres across works. Selecting a segment in the pie chart acts as an interactive 
  filter for the advanced search results."/>
  <div
        id="genre-piechart" bind:this={container}
        class="w-full h-[900px]"
    >
  </div>
  </GraphContainer>
</div>