<script lang="ts">
  import * as echarts from "echarts";
  import { onMount } from "svelte";
  import { withBasePath } from "@/lib/withBasePath";

  let { option, group = undefined, class: className = "" } = $props();

   let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;

  // IMPORTANT: onMount is declared BEFORE $effect, so the chart exists
  // when the effect runs for the first time.
  onMount(() => {
    chart = echarts.init(container);
    if (group) {
      chart.group = group;          // lets charts share zoom (see tip below)
      echarts.connect(group);
    }

    chart.on("click", (params: any) => {
      if (params.data) {
        window.location.href = withBasePath(`/data/passages/${params.data.jad_id}`);
      }
    });


    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart?.dispose();
      chart = null;
    };
  });

  $effect(() => {
    chart?.setOption(option, true);
  });
</script>

<div bind:this={container} class={className}></div>