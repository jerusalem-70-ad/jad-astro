<script lang="ts">
import { onMount } from "svelte";
import * as echarts from "echarts";
import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store.ts";

import { withBasePath } from "@/lib/withBasePath";
import GraphContainer from "@/components/visualisations/graph-container.svelte"
import GraphTitle from "@/components/visualisations/graph-title.svelte";
import { getHeatMapOption } from "@/components/visualisations/helpers.ts";

import row_liturgical_references from "@/content/row/liturgical_references"

let container: HTMLDivElement;
let chart: echarts.ECharts | null = null;

// final structured data for chart
let heatmapData: {centuries: string[], items: string[], values: [number, number, number][]} = {
  centuries:[],
  items: [],
  values: []
};
let mode = "absolute";

// computed once: order feastes by date (found in the 50kb row json)
const orderedRefNames = Object.values(row_liturgical_references)
  .filter(ref => ref.date !== null)
  .toSorted((a, b) => a.date.localeCompare(b.date))
  .map(ref => ref.name);  

//prepare data from reactive passages-graph
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

  const centurySet = new Set<string>(); // Sets to store all the cenutire and keywords
  const litRefSet = new Set<string>();
  const passagesPerCentury = new Map<string, number>(); // Map to store the total passages per century for relative frequency calculation

  passagesJson.forEach((p) => { //iterate over passages to fill the Sets
    const centuries = Array.isArray(p.century) ? p.century : [];
    centuries.forEach(c => {
      centurySet.add(c);
      passagesPerCentury.set(c, (passagesPerCentury.get(c) ?? 0) + 1);
    });
    p.liturgical_references.length > 0 ?
    p.liturgical_references.forEach(ref => litRefSet.add(ref)) : "";
  });

  const heatmap = new Map<string, Map<string, {absolute: number, relative:number}>>();
// e.g. 12 {keyword22, {absolute: 0, relative:0}} initially all keywords in all cenutries are have value 0
  centurySet.forEach(c => {
    heatmap.set(c, new Map());
    litRefSet.forEach(k => {
      heatmap.get(c)?.set(k, {absolute: 0, relative: 0});
    });
  });
// now get the actual number by looping over passages
  passagesJson.forEach((p) => {
    const centuries = Array.isArray(p.century) ? p.century : [];

    centuries.forEach(c => {
      p.liturgical_references.forEach(k => {
        const current = heatmap.get(c)?.get(k) ?? {absolute: 0, relative: 0};
        heatmap.get(c)?.set(k, {absolute: current.absolute + 1, relative: current.relative});
      });
    });
  });
  // get the relative frequency by dividing the absolute count by the total passages in that century
  heatmap.forEach((litRefMap, century) => {
    const totalPassages = passagesPerCentury.get(century) ?? 1; // avoid division by zero
    litRefMap.forEach((value, ref) => {
      heatmap.get(century)?.set(ref, {
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
const refsArray = orderedRefNames.filter(name => litRefSet.has(name));

  const values: [number, number, number][] = []; // value has [X coordinates, Y coordinates, value to display]

  centuriesArray.forEach((c, xIndex) => {
    refsArray.forEach((k, yIndex) => {
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
    items: refsArray,
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

  const [refIndex] = params.value;
  const ref = heatmapData.items[refIndex];
  if (!ref) return;

  window.location.href = withBasePath(
    `/advanced-search?JAD-temp[refinementList][liturgical_references.value][0]=${encodeURIComponent(ref)}`
  );
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
  <GraphTitle title="Liturgical Feasts Heat Map" 
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