<script lang="ts">
import { onMount} from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
  import {NOVA_VULGATA_ORDER} from "scripts/sort-bibl-ref.js";
import { filteredIds } from "@/stores/jad_store";
import GraphTitle from "@/components/visualisations/graph-title.svelte";
import GraphContainer from "@/components/visualisations/graph-container.svelte"
import {getPieChartOption} from "@/components/visualisations/helpers.ts"

let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;
let pieData: { name: string; value: number }[] = [];

    // Prepare chartdata from passages slim version.json
 $: {
    const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

    const booksCounts = new Map();

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
    chart.setOption(getPieChartOption(pieData));

    chart.on("click", (params: any) => {
      if (params.data) {
       window.location.href = withBasePath(
          `/advanced-search?JAD-temp[hierarchicalMenu][biblical_ref_lvl0][0]=${params.data.name}`
        );
      }
    });

    const resizeHandler = () => chart?.resize();
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      chart?.dispose();
    };
  });

  // Update chart when data changes
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
<GraphTitle title="Bible books references" definition = "The pie chart shows how frequently individual 
books of the Bible are cited across the passages, measured by the number of passages that reference 
a given book. Multiple references to the same biblical book within a single passage are counted as one. 
Joined referenicing: one passage can have references to multiple Bible books. 
Hence using filter 'Biblical references = Lk', for instance, will show passages with Lk references, 
and the number of references to other books found as well in these passages."/>
 
  <div
        id="bible-piechart" bind:this={container}
        class="w-full h-[900px]"
    >
  </div>
 </GraphContainer>
</div>