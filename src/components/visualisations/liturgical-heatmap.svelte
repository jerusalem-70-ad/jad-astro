<script lang="ts">
import { onMount } from "svelte";
import * as echarts from "echarts";
import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store.ts";

import { withBasePath } from "@/lib/withBasePath";
import { getHeatMapOption } from "@/components/visualisations/helpers.ts";

import row_liturgical_references from "@/content/row/liturgical_references.json"

let container: HTMLDivElement;
let chart: echarts.ECharts | null = null;
let passageCount = 0
// final structured data for chart
let heatmapData: {references: string[], items: string[], values: [number, number, number][]} = {
  references:[],
  items: [],
  values: []
};
let mode = "absolute";

// computed once: order feastes by date (found in the 50kb row json)
const YEAR_START = "12-03"; // start from Advent "MM-DD"

// Dates from 12-25 onward go in group 0 (first), everything else in group 1.
const sortKey = (date: string) => {
  const monthDay = date.slice(5); // "1099-08-13" -> "08-13"
  return monthDay >= YEAR_START ? `0-${monthDay}` : `1-${monthDay}`;
};

const orderedRefNames = Object.values(row_liturgical_references)
  .filter((ref) => ref.date !== null)
  .toSorted((a, b) => sortKey(a.date).localeCompare(sortKey(b.date)))
  .map((ref) => ref.name);

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
    references: centuriesArray,
    items: refsArray,
    values
  };
}

//initialise heatmap
onMount(() => {
  chart = echarts.init(container);


  chart.on("click", handleClick);
  // Re-fit the chart whenever the container's size changes
  // (aside toggled, window resized, layout shifted...)
  let frame: number;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => chart?.resize());
  });
  observer.observe(container);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    chart?.dispose();
  };
});
// get updates 

$: if (chart) {
  chart.setOption(getHeatMapOption(heatmapData, "feasts", passageCount), true);
}

function handleClick(params: any) {
  if (!params.value) return;

  const [refIndex] = params.value;
  const ref = heatmapData.items[refIndex];
  if (!ref) return;

  window.location.href = withBasePath(
    `/advanced-search?JAD-temp[refinementList][liturgical_references][0]=${encodeURIComponent(ref)}`
  );
};
const modes = [
  { value: "absolute", label: "Absolute numbers", hint: "Number of passages per keyword." },
  { value: "relative", label: "% per century", hint: "Percentage of passages per century." }
];
</script>

<div class="relative bg-white border rounded-md shadow-sm w-full min-w-0 h-225 overflow-hidden">
  <div class="justify-self-end p-2" role="group" aria-label="Counting mode">
     {#each modes as m}
       <button
         type="button"
         on:click={() => (mode = m.value)}
         aria-pressed={mode === m.value}
         title={m.hint}
         class="px-3 py-1 font-semibold first:rounded-l-md last:rounded-r-md shadow-sm
           {mode === m.value
             ? 'bg-brand-700 text-white'
             : 'bg-brand-600/60 text-white hover:bg-brand-500'}"
       >
         {m.label}
       </button>
     {/each}
   </div>
 
    <div bind:this={container} class="absolute w-full h-225"></div>
</div>