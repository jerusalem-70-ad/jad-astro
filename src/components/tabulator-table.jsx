import { useEffect, useRef } from "react";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_semanticui.min.css";
import { withBasePath } from "@/lib/withBasePath.js";
import {
  dateAccessor,
  dateFormatter,
  dateRangeFilter,
  customNameFilter,
} from "@/lib/tabulator-utils.js";

export default function TabulatorTable({
  data,
  columns,
  tableId = "tabulator-table",
  options = {},
  showDownloadButtons = true,
  downloadTitle = "data",
  rowClickConfig = null,
  updateMapOnFilter = false,
  mapIdField = "jad_id",
  // NEW: Timeline integration props
  updateTimelineOnFilter = false,
  timelineIdField = "jad_id",
  timelineDataMapping = null, // Function to transform data for timeline
}) {
  const tableRef = useRef(null);
  const tabulatorRef = useRef(null);

  // Process columns to add functions on the client side
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

  useEffect(() => {
    if (
      !data ||
      data.length === 0 ||
      !processedColumns ||
      processedColumns.length === 0
    ) {
      console.warn("Missing data or columns for Tabulator");
      return;
    }

    // NEW: Prepare timeline data if timeline integration is enabled
    if (updateTimelineOnFilter && timelineDataMapping) {
      // Transform the data for timeline using the provided mapping function
      const timelineData = data.map(timelineDataMapping);

      // Set the data on window object for the timeline component to use
      window.passagesTimelineData = timelineData;
      console.log("Timeline data prepared:", timelineData.length, "items");
    }

    // Initialize Tabulator
    tabulatorRef.current = new Tabulator(tableRef.current, {
      data: data,
      columns: processedColumns,
      ...defaultOptions,
    });

    // Wait for table to be built before adding event listeners
    tabulatorRef.current.on("tableBuilt", function () {
      console.log("Table built successfully");

      // Add row click listener if configuration is provided
      if (rowClickConfig) {
        tabulatorRef.current.on("rowClick", function (e, row) {
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
            const target = rowClickConfig.target || "_self";
            window.open(finalUrl, target);
          }
        });
      }

      // Add filtering event listeners for both map and timeline
      tabulatorRef.current.on("dataFiltered", function (filters, rows) {
        // Extract raw data from each RowComponent
        const filteredData = rows.map((row) => row.getData());

        console.log("Table filtered! Found", rows.length, "rows");

        // Update map if enabled
        if (updateMapOnFilter) {
          const filteredMapIds = filteredData
            .map((row) => row[mapIdField])
            .filter((id) => id);

          if (window.updateMapWithFilteredIds) {
            window.updateMapWithFilteredIds(filteredMapIds);
          } else {
            console.warn("Map update function not available");
          }
        }

        // NEW: Update timeline if enabled
        if (updateTimelineOnFilter) {
          if (window.timelineChart && window.updateTimelineColors) {
            window.updateTimelineColors(filteredData);
          } else {
            console.log(
              "Timeline not ready yet - filter applied to table only"
            );
          }
        }
      });

      // Initial updates for both map and timeline
      setTimeout(() => {
        console.log("Initial updates for map and timeline");
        try {
          const initialData = tabulatorRef.current.getData();

          // Initial map update
          if (updateMapOnFilter) {
            const initialMapIds = initialData
              .map((row) => row[mapIdField])
              .filter((id) => id);
            if (window.updateMapWithFilteredIds) {
              window.updateMapWithFilteredIds(initialMapIds);
            }
          }

          // NEW: Initial timeline update
          if (updateTimelineOnFilter) {
            if (window.timelineChart && window.updateTimelineColors) {
              window.updateTimelineColors(initialData);
            }
          }
        } catch (error) {
          console.error("Error with initial updates:", error);
        }
      }, 100);

      // Update counters
      const counter1 = document.getElementById("counter1");
      const counter2 = document.getElementById("counter2");

      if (counter1 && counter2) {
        const updateCounters = () => {
          try {
            const totalCount = tabulatorRef.current.getDataCount("all");
            const filteredCount = tabulatorRef.current.getDataCount("active");
            counter1.textContent = filteredCount;
            counter2.textContent = totalCount;
          } catch (error) {
            console.error("Error updating counters:", error);
          }
        };

        updateCounters();

        tabulatorRef.current.on("dataFiltered", function (filters, rows) {
          counter1.textContent = rows.length;
          counter2.textContent = tabulatorRef.current.getDataCount("all");
        });
      }
    });

    // NEW: Setup timeline update function on window
    if (updateTimelineOnFilter) {
      window.updateTimelineColors = function (filteredData) {
        const timelineChart = window.timelineChart;
        if (!timelineChart) {
          console.warn("Timeline chart not available");
          return;
        }

        // Get IDs of filtered items using the specified field
        const filteredIds = new Set(
          filteredData.map((item) => item[timelineIdField])
        );

        // Get current chart option
        const currentOption = timelineChart.getOption();

        if (
          !currentOption.series ||
          !currentOption.series[0] ||
          !currentOption.series[0].data
        ) {
          console.warn("Timeline chart data not available");
          return;
        }

        // Update the scatter series data with colors
        const updatedData = currentOption.series[0].data.map((node) => ({
          ...node,
          itemStyle: {
            color: filteredIds.has(node.id) ? "#a92d03" : "#FFD700", // Red if filtered, gold if not
            opacity: 0.8,
          },
        }));

        // Update the chart
        timelineChart.setOption({
          series: [
            {
              data: updatedData,
            },
          ],
        });

        console.log(
          "Timeline updated with",
          filteredIds.size,
          "filtered items"
        );
      };
    }

    // Cleanup
    return () => {
      if (tabulatorRef.current) {
        tabulatorRef.current.destroy();
        tabulatorRef.current = null;
      }

      // Clean up timeline function
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
    timelineDataMapping,
  ]);

  // Download handlers (unchanged)
  const handleDownloadCSV = () => {
    if (tabulatorRef.current) {
      tabulatorRef.current.download("csv", `${downloadTitle}.csv`);
    }
  };

  const handleDownloadJSON = () => {
    if (tabulatorRef.current) {
      tabulatorRef.current.download("json", `${downloadTitle}.json`);
    }
  };

  const handleDownloadHTML = () => {
    if (tabulatorRef.current) {
      tabulatorRef.current.download("html", `${downloadTitle}.html`, {
        style: true,
      });
    }
  };

  return (
    <div className="text-sm md:text-base w-full">
      <div className="grid gap-2 md:flex my-4 md:justify-between items-start md:items-center mb-2">
        <div className="text-brand-600 text-xl">
          Showing <span id="counter1"></span> from total of{" "}
          <span id="counter2"></span> entries
        </div>
        {showDownloadButtons && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm"
            >
              Download CSV
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm"
            >
              Download JSON
            </button>
            <button
              onClick={handleDownloadHTML}
              className="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm"
            >
              Download HTML
            </button>
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
