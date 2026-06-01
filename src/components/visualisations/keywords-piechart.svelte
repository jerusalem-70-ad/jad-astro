
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


// prepare keywords Map from all passages
const keywordCounts = new Map();

passages.forEach((p) => {
  p.keywords.forEach((k) => {
    const current = keywordCounts.get(k) ?? 0;
    keywordCounts.set(k, current + 1);
  });
});
// filter out keywords with less than 10 (A. Marx wish)

const filteredKeywordCounts = new Map(
[...keywordCounts].filter(([key, count]) => count >= 10)
);
//prepare data reactively using sorted filteredIds
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

  const counts = new Map<string, number>();

  passagesJson.forEach((p) => {
    const keywords = p.keywords || [];
    if (!keywords.length) return;
    keywords.forEach(k => {
      if(filteredKeywordCounts.has(k)){
      counts.set(k, (counts.get(k) || 0) + 1);}
    }
  )});

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
        `/advanced-search?JAD-temp[refinementList][keywords.label][0]=${params.data.name}`
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
    <GraphTitle title="Keywords accross Passages" 
    what = "This pie chart visualizes the 
    distribution of keywords across all recorded passages 
            in the database."
    how="Make a filtered selection of passages to see the discribution of keywords associated to them. 
    Select a segment to see the advanced search results. NB: passages have usually multiple keywords, 
    so filtering for keywords e.g. 'Martyrdom' AND 'Crusading' will show also other keywords attached to 
    the filtered passages."
    />
      <div
        id="keywords-piechart"
        bind:this={container}
        class="w-full h-[900px]"
      ></div>
  </GraphContainer>  
</div>