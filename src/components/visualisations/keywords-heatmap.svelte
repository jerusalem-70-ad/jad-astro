<script lang="ts">
import { onMount } from "svelte";
import * as echarts from "echarts";
import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store.ts";

import { withBasePath } from "@/lib/withBasePath";
import GraphContainer from "@/components/visualisations/graph-container.svelte"
import GraphTitle from "@/components/visualisations/graph-title.svelte";
import { getHeatMapOption } from "@/components/visualisations/helpers.ts";

let container: HTMLDivElement;
let chart: echarts.ECharts | null = null;

// final structured data for chart
let heatmapData: {centuries: string[], keywords: string[], values: [number, number, number][]} = {
  centuries:[],
  keywords: [],
  values: []
};
let mode = "absolute";

// computed once: Marx wants only keywords with min 10 occurrences
const allowedKeywords = (() => {
  const counts = new Map<string, number>();

  passages.forEach(p => {
    p.keywords.forEach(k => {
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .filter(([_, count]) => count >= 10)
    .map(([keyword]) => keyword)
    .sort();
})();

//prepare data from reactive passages-graph
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

  const centurySet = new Set<string>(); // Sets to store all the cenutire and keywords
  const keywordSet = new Set<string>();
  const passagesPerCentury = new Map<string, number>(); // Map to store the total passages per century for relative frequency calculation

  passagesJson.forEach((p) => { //iterate over passages to fill the Sets
    const centuries = Array.isArray(p.century) ? p.century : [];
    centuries.forEach(c => {
      centurySet.add(c);
      passagesPerCentury.set(c, (passagesPerCentury.get(c) ?? 0) + 1);
    });
    p.keywords.length > 0 ?
    p.keywords.forEach(k => keywordSet.add(k)) : "";
  });

  const heatmap = new Map<string, Map<string, {absolute: number, relative:number}>>();
// e.g. 12 {keyword22, {absolute: 0, relative:0}} initially all keywords in all cenutries are have value 0
  centurySet.forEach(c => {
    heatmap.set(c, new Map());
    keywordSet.forEach(k => {
      heatmap.get(c)?.set(k, {absolute: 0, relative: 0});
    });
  });
// now get the actual number by looping over passages
  passagesJson.forEach((p) => {
    const centuries = Array.isArray(p.century) ? p.century : [];

    centuries.forEach(c => {
      p.keywords.forEach(k => {
         if (!allowedKeywords.includes(k)) return; //take only keywords with min 10 occurences
        const current = heatmap.get(c)?.get(k) ?? {absolute: 0, relative: 0};
        heatmap.get(c)?.set(k, {absolute: current.absolute + 1, relative: current.relative});
      });
    });
  });
  // get the relative frequency by dividing the absolute count by the total passages in that century
  heatmap.forEach((keywordMap, century) => {
    const totalPassages = passagesPerCentury.get(century) ?? 1; // avoid division by zero
    keywordMap.forEach((value, keyword) => {
      heatmap.get(century)?.set(keyword, {
        absolute: value.absolute,
        relative: ( value.absolute / totalPassages) * 100 // relative frequency as percentage
      });
    });
  });
// convert Set to array
  const centuriesArray = Array.from(centurySet).sort((a, b) => {
  const numA = parseInt(a);
  const numB = parseInt(b);
  return numA - numB;
});
const keywordsArray = allowedKeywords
  .sort();

  const values: [number, number, number][] = []; // value has [X coordinates, Y coordinates, value to display]

  centuriesArray.forEach((c, xIndex) => {
    keywordsArray.forEach((k, yIndex) => {
      const relative = heatmap.get(c)?.get(k)?.relative ?? 0; // calculated as percent from all passages per centuries
      const absolute = heatmap.get(c)?.get(k)?.absolute ?? 0; // absolute number of passages
      // read mode set by button
      if (mode === "relative") {
      values.push([yIndex, xIndex, parseFloat(relative.toFixed(1))]);}
      else {
        values.push([yIndex, xIndex, absolute]);
      }
    })
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
    `/advanced-search?JAD-temp[refinementList][keywords.label][0]=${keyword}`
)
};
function changeMode() {
  if (mode === "absolute") {
    mode = "relative"
  }
  else mode = "absolute";
}
</script>

<div class="grid gap-2 p-3">
<GraphContainer>
  <GraphTitle title="Keywords Heat Map" 
  what="Distribution of keywords across centuries."
  how="The color intensity represents frequency. There are two counting modes: absolute shows the 
  absolute number of passages in which each keyword appears; relative shows the percentage of all 
  passages in the respective century where the keyword is detected. Taken into account are keywords with 
  at least 10 occurrences in total."
  questions="When was Anti-Judaism most prominent?"
  why="Allows patterns and trends to be easily identified over time." />
  <!--  // change the mode between absolute and relative frequency -->
  <div class="flex justify-end gap-3">
    <div class="group inline-block relative">
      <button on:click={changeMode} class="px-2 py-0.5 bg-brand-600/90 text-white font-semibold hover:bg-brand-500 rounded-md shadow-sm disabled:bg-neutral-400
           disabled:cursor-not-allowed
           disabled:hover:bg-neutral-400" disabled={mode === "absolute"}>
        Show absolute numbers
      </button>       
        <span class="invisible group-hover:visible rounded-md p-3 text-xs md:text-sm
         bg-brand-700/90 text-brand-50 w-[100px] z-50 absolute left-0 top-10">
        Absolute numbers of all passages.
        </span>
    </div>
    <div class="group inline-block relative">

     <button on:click={changeMode} class="px-2 py-0.5 bg-brand-600/90 text-white font-semibold hover:bg-brand-500 rounded-md shadow-sm disabled:bg-neutral-400
         disabled:cursor-not-allowed
         disabled:hover:bg-neutral-400" disabled={mode === "relative"}>
      Show relative numbers
    </button>
     <span class="invisible group-hover:visible rounded-md p-3 text-xs md:text-sm
         bg-brand-700/90 text-brand-50 w-[100px] z-50 absolute left-0 top-10">
    Percentage of passages per century.
        </span>
    </div>
  </div>
  <div
    bind:this={container}
    class="w-full h-[900px]"
  ></div>
  </GraphContainer>
</div>