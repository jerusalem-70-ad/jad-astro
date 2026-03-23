
<script lang="ts">
import { onMount } from "svelte";
  import * as echarts from "echarts";
  import { withBasePath } from "@/lib/withBasePath";
  import passages from "@/content/data/passagesForGraphs.json";
import { filteredIds } from "@/stores/jad_store";

let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;
let pieData: { name: string; value: number }[] = [];

//prepare data reactively using sotered filteredIds
$: {
  const passagesJson =
    $filteredIds && $filteredIds.size > 0
      ? passages.filter(p => $filteredIds.has(p.jad_id))
      : passages;

  const counts = new Map();

  passagesJson.forEach((p) => {
    const genre = p.genre;
    if (!genre) return;
    counts.set(genre, (counts.get(genre) || 0) + 1);
  });

  pieData = Array.from(counts, ([name, value]) => ({
    name,
    value
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// echart options STATIC ones
function getOption() {
    return {
    //   title: {
    //     text: "Genre Distribution across Passages",
    //     left: "center",
    //     top: 20,
    //     textStyle: {
    //       fontSize: 24,
    //       fontWeight: "bold",
    //       color: "#333",
    //     },
    //   },

      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          return `<strong>${params.data.name}</strong><br/>
                  <span>Passages: ${params.data.value}</span>`;
        },
      },

      legend: {
        orient: "horizontal",
        right: 10,
        top: "bottom",
        formatter: (name: string) => {
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

      media: [
        {
          query: { maxWidth: 600 },
          option: {
            legend: {
              orient: "horizontal",
              left: "center",
              top: "bottom",
            },
            series: [{ radius: "50%" }]
          }
        }
      ],

      animation: false,

      toolbox: {
        show: true,
        orient: "vertical",
        right: 30,
        top: 20,
        feature: {
          saveAsImage: {
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

  return () => chart.dispose();
});

$: if (chart) {
  chart.setOption({
    series: [{ data: pieData }]
  });
}

// use onMount to make sure DOm exist before initiating echarts


    onMount(() => {
    chart = echarts.init(container);
    chart.setOption(getOption());

    chart.on("click", (params: any) => {
      if (params.data) {
        window.location.href = withBasePath(
          `/advanced-search?JAD-temp[refinementList][work.genre][0]=${params.data.name}`
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
<div class="grid gap-2 p-3 ">
  <h2 class="text-2xl font-bold mb-4 text-brand-950">Genre Distribution accross Passages</h2>
  <div
        id="genre-piechart" bind:this={container}
        class="w-full"
        style={`height: 900px; width: 100%;`}
    >
  </div>
   <div class="text-brand-700 text-sm rounded-md bg-neutral-100 w-3/4 grid mx-auto p-3 border border-neutral-300">
    <p>This pie chart visualizes the distribution of genres across all recorded passages 
        in the database. Each passage is linked to a specific work, and every work is assigned 
        to a genre, allowing the chart to aggregate passages by their generic classification. 
        The relative size of each segment reflects the number of passages associated with 
        that genre. </p>
        <p>Selecting a segment in the pie chart acts as an interactive filter: 
            clicking on a genre takes you directly to the advanced search results, where all 
            passages belonging to the chosen genre are displayed.</p>
    </div>
</div>