
<script lang="ts">
import { onMount } from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store.ts";
import GraphTitle from "@/components/visualisations/graph-title.svelte"
import {getPieChartOption} from "@/components/visualisations/helpers.ts"

let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;
let pieData: { name: string; value: number }[] = [];
let passageCount = 0;

export let mode: "card" | "featured" = "featured";

//prepare data reactively using sorted filteredIds
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;
//count all passages for 'Showing'
passageCount = passagesJson.length
  // prepare works Map from all passages
console.log(passagesJson.length)
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
// console.log("worksMap", worksMap);
// console.log("genreCounts", genreCounts);
// console.log("pieData", pieData);
}
onMount(() => {
    chart = echarts.init(container);
    chart.setOption(getPieChartOption([], "works", 0, mode));

    // Only in featured mode. In a card the click should bubble up to the
    // <button> in VizArea, which promotes the card to the center.
    if (mode === "featured") {
      chart.on("click", (params: any) => {
        if (params.data) {
          window.location.href = withBasePath(
            `/advanced-search?JAD-temp[refinementList][work.genre][0]=${params.data.name}`
          );
        }
      });
    }

    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart?.dispose();
    };
  });

  $: if (chart) {
    chart.setOption(getPieChartOption(pieData, "works", passageCount, mode));
  }
</script>


   <div class="bg-white border rounded-md shadow-sm p-4">
       <GraphTitle {mode} title="Genre Distribution accross Works" 
  what = "Pie chart for the 
  distribution of genres across works."
  how = "Use the filters to make a selection of passages. The chart shows the genres of the works for 
  the filtered passages. Select a segment to see the results in the advanced search."
  why = "Find patterns and corelations between genre - place - time."
  questions = "What genres had the works written in Paris in the 12th c.? What genre have works 
  where a particular keyword occurs?"
  />
      <div bind:this={container} class={mode === "featured" ? "w-full h-225": "h-40 w-full"}></div>
   </div>