import type { EChartsOption } from "echarts";

type HeatMapData = {
  centuries: string[];
  items: string[];
  values: [number, number, number][]; // [xIndex, yIndex, value]
};

type PieDataItem = { name: string; value: number };
type PieChartValueType = "passages" | "works" | "references" | "keywords";
export type PieMode = "card" | "featured";

// The "Showing N genres from M works" text, now shared by the chart title (featured)
// and the Svelte card markup (card), so both always say the same thing.
export function getPieSummary(
  pieData: PieDataItem[],
  valueType: PieChartValueType = "passages",
): string {
  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  const categories = pieData.length;

  switch (valueType) {
    case "keywords":
      return `Showing ${categories} keywords`;
    case "works":
      return `Showing ${categories} genres from ${total} works`;
    case "references":
      return `Showing ${categories} references with ${total} instances`;
    default:
      return `Showing ${categories} categories`;
  }
}

export function getPieChartOption(
  pieData: PieDataItem[],
  valueType: PieChartValueType = "passages",
  allFilteredPassages: number = 0,
  mode: PieMode = "featured",
): EChartsOption {
  // Used by both modes
  const tooltipFormatter = (params: any) =>
    `<strong>${params.data.name}</strong><br/>
     <span>${valueType === "works" ? "Works" : "Passages"}: ${params.data.value}</span>
     <span> (${params.percent}%)</span>`;

  // ---------- CARD MODE: just the pie, tooltip on hover ----------
  if (mode === "card") {
    return {
      tooltip: {
        trigger: "item",
        textStyle: { fontSize: 12 },
        formatter: tooltipFormatter,
        appendToBody: true, // render outside the small card, so it is not clipped
        position: "left", // the cards are on the right edge, so open to the left
      },
      series: [
        {
          type: "pie",
          radius: "85%",
          center: ["50%", "50%"],
          data: pieData,
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { shadowBlur: 6, shadowColor: "rgba(0, 0, 0, 0.4)" },
          },
        },
      ],
      animation: false,
    };
  }

  // ---------- FEATURED MODE: full options legend toolbox etc ----------
  return {
    title: {
      subtext: `${getPieSummary(pieData, valueType)} || total filtered passages: ${allFilteredPassages}`,
      left: "center",
      subtextStyle: { fontSize: 16, color: "#364153", fontWeight: 500 },
    },
    tooltip: {
      trigger: "item",
      textStyle: { fontSize: 12 },
      formatter: tooltipFormatter,
    },
    legend: {
      orient: "horizontal",
      type: "scroll",
      right: 10,
      top: "bottom",
      formatter: (name: string) => {
        const item = pieData.find((d) => d.name === name);
        return item ? `${name} (${item.value})` : name;
      },
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
          legend: { orient: "horizontal", left: "center", top: "bottom" },
          series: [{ radius: "50%" }],
        },
      },
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

export function getHeatMapOption(
  heatMapData: HeatMapData,
  allFilteredPassages: number = 0,
): EChartsOption {
  const values = Array.isArray(heatMapData.values) ? heatMapData.values : [];
  const maxValue = Math.max(...values.map((v) => v[2]));
  const total = heatMapData.items.length;
  return {
    title: {
      subtext: `Showing ${total} items || total filtered passages: ${allFilteredPassages}`,
      left: "left",
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      position: "top",
      formatter: (params: any) => {
        const [x, y, value] = params.data;
        const century = heatMapData.centuries[y];
        const item = heatMapData.items[x];
        return `${item}<br/>${century}: ${value}`;
      },
    },
    grid: {
      top: 70,
      bottom: 70,
      left: 20,
      right: 60,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: heatMapData.items,
      splitArea: { show: true },
      axisLabel: {
        rotate: 60,
        interval: 0,
      },
    },
    yAxis: {
      type: "category",
      data: heatMapData.centuries.map((c) => c),
      splitArea: { show: true },
      axisLabel: {
        interval: 0, // show all labels
      },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: "horizontal",
      left: "center",
      top: 0,
      inRange: {
        color: [
          "#faf7f3",
          "#f8d8c9",
          "#f2b79b",
          "#ea9670",
          "#df7448",
          "#c95b31",
          "#a9441f",
          "#843114",
          "#5f1f0a",
          "#421305",
        ],
      },
    },
    series: [
      {
        name: "items",
        type: "heatmap",
        data: heatMapData.values,
        itemStyle: {
          borderColor: "#e8e0d4", // subtle grid lines
          borderWidth: 1,
        },
        label: {
          show: true,
          //dont show 0 values
          formatter: (params: any) => {
            return params.value[2] === 0 ? "" : params.value[2];
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
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
