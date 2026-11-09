<script lang="ts">
import { onMount} from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
  import {NOVA_VULGATA_ORDER} from "@/lib/search/utils.js";
import { filteredIds } from "@/stores/jad_store.ts";
import GraphTitle from "@/components/visualisations/graph-title.svelte";
import GraphContainer from "@/components/visualisations/graph-container.svelte"
import {getPieChartOption} from "@/components/visualisations/helpers.ts"

let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;
let pieData: { name: string; value: number }[] = [];
let passageCount = 0;
 export let mode: "card" | "featured" = "featured";
    // Prepare chartdata from passages slim version.json
 $: {
    const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;
      
      const booksCounts = new Map();
      passageCount = passagesJson.length

    passagesJson.forEach((passage) => {
    const books = [...new Set(passage.biblical_ref_lvl0)];
    if (books.length === 0) return;

    books.forEach((book) => {
        booksCounts.set(book, (booksCounts.get(book) || 0) + 1)
    });
    }); 

    pieData = Array.from(booksCounts, ([name, value]) => ({ name, value })).sort((a, b) => {
            return (
                (NOVA_VULGATA_ORDER[a.name as keyof typeof NOVA_VULGATA_ORDER] || Infinity) - 
                (NOVA_VULGATA_ORDER[b.name as keyof typeof NOVA_VULGATA_ORDER] || Infinity)
            );
        });
    }
   
    onMount(() => {
    chart = echarts.init(container);
    chart.setOption(getPieChartOption([], "references", 0, mode));

     if (mode === "featured") {
      chart.on("click", (params: any) => {
        if (params.data) {
          window.location.href = withBasePath(
          `/advanced-search?JAD-temp[hierarchicalMenu][biblical_ref_lvl0][0]=${params.data.name}`
        );
        }
      });
    }

     const resize = () => chart?.resize();
  window.addEventListener("resize", resize);

    chart.on("click", (params: any) => {
      if (params.data) {
       window.location.href = withBasePath(
          `/advanced-search?JAD-temp[hierarchicalMenu][biblical_ref_lvl0][0]=${params.data.name}`
        );
      }
    });

    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart?.dispose();
    };
  });

  $: if (chart) {
    chart.setOption(getPieChartOption(pieData, "references", passageCount, mode));
  }

</script>
<div class="bg-white border rounded-md shadow-sm p-4">

  <GraphTitle {mode} title="Biblical references" 
  what="Pie chart for distribution of bible references accross works."
  how = "Explore how frequently individual books of the Bible are cited across the passages. 
  NB: Multiple references to the same biblical book within a single passage are counted as one. 
  NB: One passage can have references to multiple Bible books. 
  Hence using filter 'Biblical references = Lk' will show passages with Lk references, 
  and the number of references to other books found as well in these passages."
  questions="Which bible books are cited most in Sermons / in particular work? Which bible books 
  cites a particular author?"/>
 
  <div
        id="bible-piechart" bind:this={container}
        class={mode === "featured" ? "w-full h-225": "h-40 w-full"}
    >
  </div>
</div>