<script>
  import { onMount, onDestroy } from "svelte";
  import { TabulatorFull as Tabulator } from "tabulator-tables";
  import "tabulator-tables/dist/css/tabulator_semanticui.min.css";

  import { withBasePath } from "@/lib/withBasePath.js";
  import {
    dateAccessor,
    dateFormatter,
    dateRangeFilter,
    customNameFilter,
    scrollableCellFormatter,
  } from "@/lib/tabulator-utils.js";

  /* ---------- props ---------- */
  export let data = [];
  export let columns = [];
  export let tableId = "tabulator-table";
  export let options = {};
  export let showDownloadButtons = true;
  export let downloadTitle = "data";
  export let rowClickConfig = null;

  // Map integration
  export let updateMapOnFilter = false;
  export let mapIdField = "jad_id";
  export let mapFilterMode = "single";

  // Timeline integration
  export let updateTimelineOnFilter = false;
  export let timelineIdField = "jad_id";

  let tableEl;
  let tabulator;

  /* ---------- derived columns ---------- */
  $: processedColumns = columns.map((column) => {
    switch (column.field) {
      case "origDate":
      case "editDate":
        return {
          ...column,
          accessor: dateAccessor,
          formatter: dateFormatter,
          headerFilterFunc: dateRangeFilter,
        };
      case "aut_name":
        return {
          ...column,
          headerFilterFunc: customNameFilter,
        };
      case "related_passages":
        return {
          ...column,
          formatter: scrollableCellFormatter,
          formatterParams: { scrollable: true },
          minWidth: 150,
        };
      default:
        return column;
    }
  });

  const defaultOptions = {
    layout: "fitColumns",
    headerFilterLiveFilterDelay: 600,
    responsiveLayout: "collapse",
    rowHeader: {
      formatter: "responsiveCollapse",
      width: 30,
      minWidth: 30,
      hozAlign: "center",
      resizable: false,
      headerSort: false,
    },
    pagination: true,
    movableColumns: true,
    resizableRows: true,
  };

  /* ---------- helpers ---------- */

  function prepareTimelineData() {
    if (!updateTimelineOnFilter || !data?.length) return false;

    const timelineData = data
      .map((item) => {
        try {
          return {
            id: item.jad_id || `unknown_${Math.random()}`,
            author: item.aut_name || "Unknown Author",
            work_title: item.work || "Unknown Work",
            date_post_quem: item.origDate?.[0]?.not_before ?? 500,
            date_ante_quem: item.origDate?.[0]?.not_after ?? 1200,
            passage: item.passage || "",
            work_position: item.work_position || "",
            biblical_references: item.biblical_references || "",
            alt_name: item.alt_name || "",
            keywords: item.keywords || "",
          };
        } catch (err) {
          console.error("Timeline mapping error:", err);
          return null;
        }
      })
      .filter(Boolean);

    window.passagesTimelineData = timelineData;
    return true;
  }

  function setupRowClickHandler() {
    if (!rowClickConfig) return;

    tabulator.on("rowClick", (e, row) => {
      const rowData = row.getData();
      let url;

      if (typeof rowClickConfig.getUrl === "function") {
        url = rowClickConfig.getUrl(rowData);
      } else if (rowClickConfig.urlPattern && rowClickConfig.idField) {
        url = rowClickConfig.urlPattern.replace(
          "{id}",
          rowData[rowClickConfig.idField]
        );
      }

      if (url) {
        const finalUrl = withBasePath(url);
        const target =
          e.ctrlKey || e.metaKey
            ? "_blank"
            : rowClickConfig.target || "_self";
        window.open(finalUrl, target);
      }
    });
  }

  function setupFilterHandlers() {
    tabulator.on("dataFiltered", (filters, rows) => {
      const filteredData = rows.map((r) => r.getData());

      if (updateMapOnFilter && window.updateMapWithFilteredIds) {
        let ids = [];

        if (mapFilterMode === "dual") {
          const authorIds = filteredData
            .map((r) => r.aut_jad_id)
            .filter(Boolean);
          const msIds = filteredData
            .flatMap((r) => r.ms_jad_ids || [])
            .filter(Boolean);
          ids = [...new Set([...authorIds, ...msIds])];
        } else {
          ids = filteredData.map((r) => r[mapIdField]).filter(Boolean);
        }

        window.updateMapWithFilteredIds(ids);
      }

      if (
        updateTimelineOnFilter &&
        window.timelineChart &&
        window.updateTimelineColors
      ) {
        window.updateTimelineColors(filteredData);
      }
    });
  }

  function setupCounters() {
    const counter1 = document.getElementById("counter1");
    const counter2 = document.getElementById("counter2");
    if (!counter1 || !counter2) return;

    const update = () => {
      counter1.textContent = tabulator.getDataCount("active");
      counter2.textContent = tabulator.getDataCount("all");
    };

    update();
    tabulator.on("dataFiltered", (filters, rows) => {
      counter1.textContent = rows.length;
      counter2.textContent = tabulator.getDataCount("all");
    });
  }

  function setupTimelineColorUpdate() {
    if (!updateTimelineOnFilter) return;

    window.updateTimelineColors = (filteredData) => {
      const chart = window.timelineChart;
      if (!chart) return;

      const ids = new Set(filteredData.map((d) => d[timelineIdField]));
      const option = chart.getOption();

      if (!option?.series?.[0]?.data) return;

      chart.setOption({
        series: [
          {
            data: option.series[0].data.map((node) => ({
              ...node,
              itemStyle: {
                color: ids.has(node.id) ? "#a92d03" : "#FFD700",
                opacity: 0.8,
              },
            })),
          },
        ],
      });
    };
  }

  function performInitialUpdates() {
    setTimeout(() => {
      const initialData = tabulator.getData();

      if (updateMapOnFilter && window.updateMapWithFilteredIds) {
        let ids = [];

        if (mapFilterMode === "dual") {
          const a = initialData.map((r) => r.aut_jad_id).filter(Boolean);
          const m = initialData.flatMap((r) => r.ms_jad_ids || []).filter(Boolean);
          ids = [...new Set([...a, ...m])];
        } else {
          ids = initialData.map((r) => r[mapIdField]).filter(Boolean);
        }

        window.updateMapWithFilteredIds(ids);
      }

      if (
        updateTimelineOnFilter &&
        window.timelineChart &&
        window.updateTimelineColors
      ) {
        window.updateTimelineColors(initialData);
      }
    }, 100);
  }

  /* ---------- lifecycle ---------- */

  onMount(() => {
    if (!data.length || !processedColumns.length) return;

    prepareTimelineData();

    tabulator = new Tabulator(tableEl, {
      data,
      columns: processedColumns,
      ...defaultOptions,
      ...options,
    });

    tabulator.on("tableBuilt", () => {
      setupRowClickHandler();
      setupFilterHandlers();
      setupCounters();
      performInitialUpdates();
    });

    setupTimelineColorUpdate();
  });

  onDestroy(() => {
    tabulator?.destroy();
    tabulator = null;

    if (updateTimelineOnFilter && window.updateTimelineColors) {
      delete window.updateTimelineColors;
    }
  });

  /* ---------- downloads ---------- */

  function handleDownload(format) {
    if (!tabulator) return;
    const opts = format === "html" ? { style: true } : {};
    tabulator.download(format, `${downloadTitle}.${format}`, opts);
  }
</script>

<div class="text-sm w-full">
  <div class="grid gap-2 md:flex my-4 md:justify-between items-start md:items-center mb-2">
    <div class="text-brand-600 text-base">
      Showing <span id="counter1"></span> from total of
      <span id="counter2"></span> entries
    </div>

    {#if showDownloadButtons}
      <div class="flex gap-2 justify-end">
        {#each ["csv", "json", "html"] as format}
          <button
            on:click={() => handleDownload(format)}
            class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm capitalize"
          >
            Download {format.toUpperCase()}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div
    bind:this={tableEl}
    id={tableId}
    style="min-height: 100px; width: 100%;"
  />
</div>
