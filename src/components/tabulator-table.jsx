import { useEffect, useRef } from "react";
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

export default function TabulatorTable({
  data,
  columns,
  tableId = "tabulator-table",
  options = {},
  showDownloadButtons = true,
  downloadTitle = "data",
  rowClickConfig = null,
  // Map integration props
  updateMapOnFilter = false,
  mapIdField = "jad_id",
  // Timeline integration props
  updateTimelineOnFilter = false,
  timelineIdField = "jad_id",
}) {
  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);

  // Process columns with custom formatters and filters
  const processedColumns = columns.map((column) => {
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
    ...options,
  };

  // Helper function to prepare timeline data
  const prepareTimelineData = () => {
    if (!updateTimelineOnFilter || !data?.length) {
      return false;
    }

    // Define timeline mapping function inside the component
    const timelineDataMapping = (item) => {
      try {
        if (!item || typeof item !== "object") {
          console.warn("Invalid item for timeline mapping:", item);
          return null;
        }

        return {
          id: item.jad_id || `unknown_${Math.random()}`,
          author: item.aut_name || "Unknown Author",
          work_title: item.work || "Unknown Work",
          date_post_quem: item.origDate[0]?.not_before || 500,
          date_ante_quem: item.origDate[0]?.not_after || 1200,
          passage: item.passage || "",
          work_position: item.work_position || "",
          biblical_references: item.biblical_references || "",
          alt_name: item.alt_name || "",
          keywords: item.keywords || "",
        };
      } catch (error) {
        console.error("Error mapping timeline item:", error, item);
        return null;
      }
    };

    try {
      const timelineData = data
        .map(timelineDataMapping)
        .filter((item) => item !== null);
      window.passagesTimelineData = timelineData;
      console.log("Timeline data prepared:", timelineData.length, "items");
      console.log("First timeline item:", timelineData[0]);
      return true;
    } catch (error) {
      console.error("Error preparing timeline data:", error);
      return false;
    }
  };

  // Helper function to setup row click handler
  const setupRowClickHandler = (tabulator) => {
    if (!rowClickConfig) return;

    tabulator.on("rowClick", function (e, row) {
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
          e.ctrlKey || e.metaKey ? "_blank" : rowClickConfig.target || "_self";
        window.open(finalUrl, target);
      }
    });
  };

  // Helper function to setup filter handlers
  const setupFilterHandlers = (tabulator) => {
    tabulator.on("dataFiltered", function (filters, rows) {
      const filteredData = rows.map((row) => row.getData());
      console.log("Table filtered:", rows.length, "rows");

      // Update map if enabled
      if (updateMapOnFilter) {
        const filteredMapIds = filteredData
          .map((row) => row[mapIdField])
          .filter((id) => id);

        if (window.updateMapWithFilteredIds) {
          window.updateMapWithFilteredIds(filteredMapIds);
        }
      }

      // Update timeline if enabled
      if (
        updateTimelineOnFilter &&
        window.timelineChart &&
        window.updateTimelineColors
      ) {
        window.updateTimelineColors(filteredData);
      }
    });
  };

  // Helper function to perform initial updates
  const performInitialUpdates = (tabulator) => {
    setTimeout(() => {
      try {
        const initialData = tabulator.getData();

        // Initial map update
        if (updateMapOnFilter && window.updateMapWithFilteredIds) {
          const initialMapIds = initialData
            .map((row) => row[mapIdField])
            .filter((id) => id);
          window.updateMapWithFilteredIds(initialMapIds);
        }

        // Initial timeline update
        if (
          updateTimelineOnFilter &&
          window.timelineChart &&
          window.updateTimelineColors
        ) {
          window.updateTimelineColors(initialData);
        }
      } catch (error) {
        console.error("Error with initial updates:", error);
      }
    }, 100);
  };

  // Helper function to setup counter updates
  const setupCounters = (tabulator) => {
    const counter1 = document.getElementById("counter1");
    const counter2 = document.getElementById("counter2");

    if (!counter1 || !counter2) return;

    const updateCounters = () => {
      try {
        const totalCount = tabulator.getDataCount("all");
        const filteredCount = tabulator.getDataCount("active");
        counter1.textContent = filteredCount;
        counter2.textContent = totalCount;
      } catch (error) {
        console.error("Error updating counters:", error);
      }
    };

    updateCounters();
    tabulator.on("dataFiltered", (filters, rows) => {
      counter1.textContent = rows.length;
      counter2.textContent = tabulator.getDataCount("all");
    });
  };

  // Helper function to setup timeline color update function
  const setupTimelineColorUpdate = () => {
    if (!updateTimelineOnFilter) return;

    window.updateTimelineColors = function (filteredData) {
      const timelineChart = window.timelineChart;
      if (!timelineChart) return;

      const filteredIds = new Set(
        filteredData.map((item) => item[timelineIdField])
      );

      const currentOption = timelineChart.getOption();
      if (!currentOption?.series?.[0]?.data) return;

      const updatedData = currentOption.series[0].data.map((node) => ({
        ...node,
        itemStyle: {
          color: filteredIds.has(node.id) ? "#a92d03" : "#FFD700",
          opacity: 0.8,
        },
      }));

      timelineChart.setOption({
        series: [{ data: updatedData }],
      });

      console.log("Timeline updated with", filteredIds.size, "filtered items");
    };
  };

  useEffect(() => {
    // Validation
    if (!data?.length || !processedColumns?.length) {
      console.warn("Missing data or columns for Tabulator");
      return;
    }
    console.log("sample data item:", data[0]);

    // Prepare timeline data if needed
    prepareTimelineData();

    // Initialize Tabulator
    const tabulator = new Tabulator(tableRef.current, {
      data: data,
      columns: processedColumns,
      ...defaultOptions,
    });

    tabulatorRef.current = tabulator;

    // Setup all handlers when table is built
    tabulator.on("tableBuilt", function () {
      console.log("Table built successfully");

      setupRowClickHandler(tabulator);
      setupFilterHandlers(tabulator);
      setupCounters(tabulator);
      performInitialUpdates(tabulator);
    });

    // Setup timeline integration
    setupTimelineColorUpdate();

    // Cleanup function
    return () => {
      if (tabulatorRef.current) {
        tabulatorRef.current.destroy();
        tabulatorRef.current = null;
      }
      if (updateTimelineOnFilter && window.updateTimelineColors) {
        delete window.updateTimelineColors;
      }
    };
  }, [
    data,
    columns,
    rowClickConfig,
    updateMapOnFilter,
    mapIdField,
    updateTimelineOnFilter,
    timelineIdField,
  ]);

  // Download handlers
  const handleDownload = (format) => {
    if (tabulatorRef.current) {
      const options = format === "html" ? { style: true } : {};
      tabulatorRef.current.download(
        format,
        `${downloadTitle}.${format}`,
        options
      );
    }
  };

  return (
    <div className="text-sm w-full">
      <div className="grid gap-2 md:flex my-4 md:justify-between items-start md:items-center mb-2">
        <div className="text-brand-600 text-base">
          Showing <span id="counter1"></span> from total of{" "}
          <span id="counter2"></span> entries
        </div>

        {showDownloadButtons && (
          <div className="flex gap-2 justify-end">
            {["csv", "json", "html"].map((format) => (
              <button
                key={format}
                onClick={() => handleDownload(format)}
                className="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm capitalize"
              >
                Download {format.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={tableRef}
        id={tableId}
        style={{ minHeight: "100px", width: "100%" }}
      />
    </div>
  );
}
