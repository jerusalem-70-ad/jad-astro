// helpers.ts
import type { EChartsOption } from "echarts";

type PieDataItem = {
  name: string;
  value: number;
};
type HeatMapData = {
  centuries: number[];
  keywords: string[];
  values: [number, number, number][]; // [xIndex, yIndex, value]
};

export function getPieChartOption(pieData: PieDataItem[]): EChartsOption {
  return {
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

export function getHeatMapOption(heatMapData: HeatMapData): EChartsOption {
  const values = Array.isArray(heatMapData.values) ? heatMapData.values : [];
  const maxValue = Math.max(...values.map((v) => v[2]));
  return {
    tooltip: {
      position: "top",
      formatter: (params: any) => {
        const [x, y, value] = params.data;
        const century = heatMapData.centuries[y];
        const keyword = heatMapData.keywords[x];
        return `${keyword}<br/>${century}: ${value}`;
      },
    },
    grid: {
      top: 60,
      bottom: 160, // leave space for visualMap
    },
    xAxis: {
      type: "category",
      data: heatMapData.keywords.map((k) => k.substring(0, 15)),
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
          "#faf7f3", // brand-50  (very light, near zero)
          "#e6d5c3", // brand-200
          "#e5894a", // brand-300 (nice mid highlight)
          "#a92d03", // brand-500 (strong)
          "#421305", // brand-900 (max intensity)
        ],
      },
    },
    series: [
      {
        name: "keywords",
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
  };
}
