<script lang="ts">
import { onMount } from "svelte";
import * as echarts from "echarts";
import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store.ts";

import { withBasePath } from "@/lib/withBasePath";
import GraphContainer from "@/components/visualisations/graph-container.svelte"
import GraphTitle from "@/components/visualisations/graph-title.svelte";
import { getHeatMapOption } from "@/components/visualisations/helpers.ts";

import row_liturgical_references from "@/content/row/liturgical_references.json"

let container: HTMLDivElement;
let chart: echarts.ECharts | null = null;
let passageCount = 0
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
passageCount = passagesJson.length
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
  // alternatively count only by the passages with liturgical feasts
  // if (p.liturgical_references.length > 0) {
    // passagesPerCentury.set(c, (passagesPerCentury.get(c) ?? 0) + 1);
    //}

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
  chart.setOption(getHeatMapOption(heatmapData, passageCount), true);
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
const modes = [
  { value: "absolute", label: "Absolute numbers", hint: "Number of passages per feast." },
  { value: "relative", label: "% per century", hint: "Percentage of passages per century." }
];
</script>

<div class="grid gap-2 p-3">
<GraphContainer>
  <GraphTitle title="Liturgical Feasts Heat Map" 
  what="Some passages, mainly
  those from liturgical texts such as sermons, are tied to one particular feast. The heat map shows
  how many passages relate to each feast. The x-axis lists the feasts in calendar order, the y-axis
  the centuries. A passage is placed in the century (or centuries) in which its source work was
  written, and under the feast it was composed for. A passage whose work is dated to two centuries is counted in both."
  how="The color intensity represents frequency. There are two counting modes: absolute shows the
  number of passages related to a feast; relative shows the percentage of all passages in the
  respective century that relate to this feast (e.g. in the 9th c. there are 2 passages related to 
  Easter - absolute; these make in relative numbers 0,5 % of all pasages from the 9th c.). 
  "
  questions="At what moment in the liturgical year | For what liturgical occasion were most passages written?"
  why="Allows patterns and trends to be easily identified over time." />
  <!--  // change the mode between absolute and relative frequency -->
  <div class="flex justify-end">
  <div class="inline-flex rounded-md shadow-sm" role="group" aria-label="Counting mode">
    {#each modes as m}
      <button
        type="button"
        on:click={() => (mode = m.value)}
        aria-pressed={mode === m.value}
        title={m.hint}
        class="px-3 py-1 font-semibold first:rounded-l-md last:rounded-r-md
          {mode === m.value
            ? 'bg-brand-700 text-white'
            : 'bg-brand-600/60 text-white hover:bg-brand-500'}"
      >
        {m.label}
      </button>
    {/each}
  </div>
</div>
  <div
    bind:this={container}
    class="w-full h-225"
  ></div>
  </GraphContainer>
</div>