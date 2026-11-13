<script lang="ts">
  import { onMount } from "svelte";
  import { TabulatorFull as Tabulator } from "tabulator-tables";
  import "tabulator-tables/dist/css/tabulator_semanticui.min.css";
import Table from "@lucide/svelte/icons/table";


  import passages from "@/content/data/passagesForGraphs.json";
  import { filteredIds } from "@/stores/jad_store.ts";
  import { withBasePath } from "@/lib/withBasePath";
import GraphContainer from "@/components/visualisations/graph-container.svelte";
  import GraphTitle from "@/components/visualisations/graph-title.svelte";
  import { passagesDashboardConfig } from "@/lib/tabulator/tabulator-table-configs.js";

  export let mode: "card" | "featured" = "featured";

  const downloadTitle = "passages";

  let container: HTMLDivElement;
  let table: Tabulator | null = null;
  let tableBuilt = false;

  let rows: ReturnType<typeof passagesDashboardConfig.transformData> = [];
  let passageCount = 0;

  // Counters (plain variables: Svelte updates the page when they change)
  let activeCount = 0; // rows currently shown after the header filters
  let totalCount = 0; // all rows given to the table

  // 1. Prepare the data: use the filtered ids if there are any, else everything
  $: {
    const filtered =
      $filteredIds && $filteredIds.size > 0
        ? passages.filter((p) => $filteredIds.has(p.jad_id))
        : passages;

    rows = passagesDashboardConfig.transformData(filtered);
    passageCount = rows.length;
  }

  function updateCounts() {
    if (!table) return;
    activeCount = table.getDataCount("active");
    totalCount = table.getDataCount("all");
  }

  // 2. Create the table once (only in featured mode, the card has no table)
  onMount(() => {
    if (mode !== "featured") return;

    table = new Tabulator(container, {
      data: rows,
      columns: passagesDashboardConfig.getColumns(),
      layout: "fitColumns",
      responsiveLayout: "collapse",
      pagination: true,
      paginationSize: 25,
      paginationSizeSelector: [10, 25, 50, 100],
      placeholder: "No passages match the current filters",
    });

    // replaceData() only works after the table is built
    table.on("tableBuilt", () => {
      tableBuilt = true;
      updateCounts();
    });

    // fires whenever the header filters change the visible rows
    // use the rows the event hands us: getDataCount("active") is still
    // the OLD result at this moment, which caused the one-step-behind count
    table.on("dataFiltered", (_filters, filteredRows) => {
      activeCount = filteredRows.length;
    });

    // click on a row -> open the passage page
    table.on("rowClick", (e: UIEvent, row) => {
      const target = e.target as HTMLElement;

      // don't navigate when the user opens a collapsed row (the +/- toggle)
      if (target.closest(".tabulator-responsive-collapse-toggle")) return;

      // don't navigate when the user is selecting text to copy it
      if (window.getSelection()?.toString()) return;

      const { jad_id } = row.getData();
      if (!jad_id) return;

      window.location.href = withBasePath(`/data/passages/${jad_id}`);
    });

    return () => {
      table?.destroy();
      table = null;
      tableBuilt = false;
    };
  });

  // 3. Whenever the rows change, update the existing table (no rebuild)
  $: if (table && tableBuilt) {
    table.replaceData(rows).then(updateCounts);
  }

  function handleDownload(format: string) {
    if (!table) return;
    // style: true keeps the table styling in the html export
    const opts = format === "html" ? { style: true } : {};
    table.download(format as "csv" | "json" | "html", `${downloadTitle}.${format}`, opts);
  }
</script>
    <GraphContainer {mode}>


  <GraphTitle
    {mode}
    title="Passages Table"
    what="Browse the passages matching the current filters in a table."
    how="Use the header filters to narrow the table further. Drag column borders to resize them. Click a row to open the passage."
    why="Read and compare the passages behind the visualisations."
    questions="Which passages are behind a pattern I see in the other charts?"
  />
  {#if mode === "featured"}
    <div class="text-sm w-full min-w-0 max-w-full">
      <div class="grid gap-2 md:flex my-4 md:justify-between items-start md:items-center mb-2">
        <div class="text-brand-600 text-base">
          Showing {activeCount} from total of {totalCount} entries
        </div>

        <div class="flex gap-2 justify-end">
          {#each ["csv", "json", "html"] as format}
            <button
              type="button"
              on:click={() => handleDownload(format)}
              class="px-3 py-1 bg-brand-600 text-brand-50 rounded hover:bg-brand-800 text-sm capitalize"
            >
              Download {format.toUpperCase()}
            </button>
          {/each}
        </div>
      </div>

      <div bind:this={container} class="passages-table w-full"></div>
    </div>
  {:else}
    <div class="grid h-30 ">
      <p class="flex items-center justify-center text-xs text-neutral-600">
        {passageCount} passages
      </p>
        <Table class="m-auto h-24 w-24 text-brand-650" aria-hidden="true" />
    </div>

  {/if}
</GraphContainer>
