// helpers.ts
import type { EChartsOption } from "echarts";

type PieDataItem = {
  name: string;
  value: number;
};
type HeatMapData = {
  centuries: string[];
  items: string[];
  values: [number, number, number][]; // [xIndex, yIndex, value]
};

type PieChartValueType = "passages" | "works" | "references" | "keywords";

export function getPieChartOption(
  pieData: PieDataItem[],
  valueType: PieChartValueType = "passages",
  allFilteredPassages: number = 0,
): EChartsOption {
  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  const categories = pieData.length;
  return {
    title: {
      subtext:
        valueType === "keywords"
          ? `Showing ${categories} keywords || total filtered passages: ${allFilteredPassages}`
          : valueType === "works"
            ? `Showing ${categories} genres from ${total} works || total filtered passages: ${allFilteredPassages}`
            : valueType === "references"
              ? `Showing ${categories} references with ${total} instances || total filtered passages: ${allFilteredPassages}`
              : `Showing ${categories} categories || total filtered passages: ${allFilteredPassages}`,
      left: "center",
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: "item",
      textStyle: { fontSize: 12 },
      formatter: function (params: any) {
        return `<strong>${params.data.name}</strong><br/>
                        <span>${valueType === "works" ? "Works" : "Passages"}: ${params.data.value}</span>
                        <span> (${params.percent}%)</span>`;
      },
    },

    legend: {
      orient: "horizontal",
      type: "scroll",
      right: 10,
      top: "bottom",
      formatter: function (name: string) {
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
          legend: {
            orient: "horizontal",
            left: "center",
            top: "bottom",
          },
          series: [
            {
              radius: "50%",
            },
          ],
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
