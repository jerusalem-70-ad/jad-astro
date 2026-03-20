<script lang="ts">
import { onMount} from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
  import {NOVA_VULGATA_ORDER} from "scripts/sort-bibl-ref.js";
import { filteredIds } from "@/stores/jad_store";

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

    function getOption() {
        return {
        title: {
            text: "Bible books accross Passages",
            left: "center",
            top: 20,
            textStyle: {
                fontSize: 24,
                fontWeight: "bold",
                color: "#333",
            },
        },
        
        tooltip: {
            trigger: "item",
            textStyle: { fontSize: 12 },
            formatter: function (params: any) {
            return `<strong>${params.data.name}</strong><br/>
                    <span>Passages: ${params.data.value}</span>`;
            },
        },

        legend: {
            orient: "horizontal",
            //type: "scroll",
            right: 10,
            top: "bottom",
            formatter: function (name : string) {
                // find the corresponding value in pieData
                const item = pieData.find(d => d.name === name);
                return item ? `${name} (${item.value})` : name;
            }
        },
    
        series: [
            {
            type: "pie",
            radius: "60%",
            data: pieData,
            emphasis: {
                itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
                },
            },
            
            },
        ],
// Responsive settings for smaller screens
         media: [
            {
            query: {
                maxWidth: 600, 
            },
            option: {
                legend: {
                    orient: "horizontal",
                    left: "center",
                    top: "bottom",
                },
                series: [
                    {
                        radius: "50%",
                    }
                ]
            }
            }
        ],
            
        animation: false,
    
        toolbox: {
            show: true,
            orient: "vertical",
            right: 30,
            top: 20,
            itemSize: 20,
            itemGap: 20,
            feature: {
            saveAsImage: {
                show: true,
                title: "Download as PNG",
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#fff",
            },
            },
        },
        };
    }

    onMount(() => {
    chart = echarts.init(container);
    chart.setOption(getOption());

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
<div class="lg:grid grid-cols-[1fr_4fr] gap-3 lg:p-10 p-3 border rounded-lg bg-brand-50 shadow-2xl">
  <div class="text-brand-700 prose">
    <h2 class="text-2xl font-semibold mb-4 text-brand-950">Bible books references</h2>
    <p>The pie chart shows how frequently individual books of the Bible are cited across the passages, measured by the number of passages that reference a given book. Multiple references to the same biblical book within a single passage are counted as one. </p>
    <p>Selecting a segment in the pie chart acts as an interactive filter leading  you directly to the advanced search results, where all 
        passages citing this Bible book are displayed.</p>
  </div>
    <div
        id="bible-piechart" bind:this={container}
        class="w-full"
        style={`height: 900px; width: 100%;`}
    >
  </div>
</div>