<script lang="ts">
import { onMount } from "svelte";
import * as echarts from "echarts";
import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store";

  import { withBasePath } from "@/lib/withBasePath";

import GraphTitle from "@/components/visualisations/graph-title.svelte";
import { getHeatMapOption } from "@/components/visualisations/helpers.ts";

let container: HTMLDivElement;
let chart: echarts.ECharts | null = null;

// final structured data for chart
let heatmapData = {
  centuries: [],
  keywords: [],
  values: []
};

//prepare data from reactive passages-graph
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

  const centurySet = new Set<string>(); // Sets to store all the cenutire and keywords
  const keywordSet = new Set<string>();

  passagesJson.forEach((p) => { //iterate over passages to fill the Sets
    const centuries = Array.isArray(p.century) ? p.century : [];
    centuries.forEach(c => centurySet.add(c));
    p.keywords.length > 0 ?
    p.keywords.forEach(k => keywordSet.add(k)) : "";
  });

  const heatmap = new Map<string, Map<string, number>>();
// e.g. 12 {keyword22, 0} initially all keywords in all cenutries are have value 0
  centurySet.forEach(c => {
    heatmap.set(c, new Map());
    keywordSet.forEach(k => {
      heatmap.get(c).set(k, 0);
    });
  });
// now get the actual number by looping over passages
  passagesJson.forEach((p) => {
    const centuries = Array.isArray(p.century) ? p.century : [];

    centuries.forEach(c => {
      p.keywords.forEach(k => {
        const current = heatmap.get(c)?.get(k) ?? 0;
        heatmap.get(c)?.set(k, current + 1);
      });
    });
  });
// convert Set to array
  const centuriesArray = Array.from(centurySet).sort((a, b) => {
  const numA = parseInt(a);
  const numB = parseInt(b);
  return numA - numB;
});
  const keywordsArray = Array.from(keywordSet);

  const values: [number, number, number][] = []; // value has [X coordinates, Y coordinates, value to display]

  centuriesArray.forEach((c, xIndex) => {
    keywordsArray.forEach((k, yIndex) => {
      values.push([yIndex, xIndex, heatmap.get(c).get(k)]);
    });
  });

  heatmapData = {
    centuries: centuriesArray,
    keywords: keywordsArray,
    values
  };
}

//initialise heatmap
onMount(() => {
  chart = echarts.init(container);

  const resizeHandler = () => chart?.resize();
  window.addEventListener("resize", resizeHandler);

  chart.on("click", handleClick);

  return () => {
    window.removeEventListener("resize", resizeHandler);
    chart?.dispose();
  };
});

// get updates 

$: if (chart) {
  chart.setOption(getHeatMapOption(heatmapData), true);

}

function handleClick(params: any) {
  if (!params.value) return;

  const [keywordIndex] = params.value;
  const keyword = heatmapData.keywords[keywordIndex];

  if (!keyword) return;

  window.location.href = withBasePath(
    `/advanced-search?JAD-temp[refinementList][work.keywords.value][0]=${keyword}`
)
};
</script>

<div class="grid gap-2 p-3">
  <GraphTitle title="Keywords Heat Map" definition="Lorem ipsum." />

  <div
    bind:this={container}
    class="w-full h-[900px]"
  ></div>
</div>