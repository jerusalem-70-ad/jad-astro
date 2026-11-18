<script lang="ts">
  import EChart from "@/components/visualisations/bibl-refs/chart-wrapper.svelte";
  import { buildPoints } from "@/components/visualisations/bibl-refs/plot-data.ts";
  import type { PassageForBiblRefs } from "@/types/index";
  import {
    extractBookAbbreviation,
    parseChapterVerse,
    NOVA_VULGATA_ORDER,
  } from "@/lib/search/utils.js";

  let { passagesForBibleRefs }: { passagesForBibleRefs: PassageForBiblRefs[] } = $props();

  // ─────────────────────────────────────────────
  // GROUP 1: static data, computed ONCE
  // ─────────────────────────────────────────────

  // book -> set of chapters that occur
  const booksMap = new Map<string, Set<number>>();
  for (const p of passagesForBibleRefs) {
    for (const ref of p.biblRefs) {
      const book = extractBookAbbreviation(ref);
      if (!book) continue;
      const { chapter } = parseChapterVerse(ref, book);
      if (chapter === null) continue;
      if (!booksMap.has(book)) booksMap.set(book, new Set());
      booksMap.get(book)!.add(chapter);
    }
  }

  const rank = (book: string): number =>
    NOVA_VULGATA_ORDER[book as keyof typeof NOVA_VULGATA_ORDER] ?? Number.MAX_SAFE_INTEGER;

  const books = [...booksMap.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

  // one random year per work + the set of genres (one loop does both)
  const yearByWork = new Map<string, number>();
  const genres = new Set<string>();
  for (const p of passagesForBibleRefs) {
    const { notBefore, notAfter } = p.date[0];
    yearByWork.set(p.jad_id, Math.round(notBefore + Math.random() * (notAfter - notBefore)));
    if (p.genre !== "minorGenre") genres.add(p.genre); //we group genres with < 10 occurences as "minor"
  }

  // fixed y-axis range for the date chart
  const allYears = passagesForBibleRefs.flatMap((p) =>
    p.date.flatMap((d) => [d.notBefore, d.notAfter])
  );
  const yMin = Math.floor(Math.min(...allYears) / 100) * 100;
  const yMax = Math.ceil(Math.max(...allYears) / 100) * 100;

  // fixed category list for the cluster chart
  const clusters = [
    ...new Set(passagesForBibleRefs.map((p) => p.cluster?.[0]).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  // colors for the genres and points
  const PALETTE = [
    "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
    "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#17becf",
  ];
  const MINOR_COLOR = "#bdbdbd";
  const genreList = [...genres].sort((a, b) => a.localeCompare(b));
  const colorByGenre = new Map(genreList.map((g, i) => [g, PALETTE[i]]));

  // ─────────────────────────────────────────────
  // GROUP 2: selection state
  // ─────────────────────────────────────────────
  let selectedBook = $state(books[0]);
  const chapters = $derived([...(booksMap.get(selectedBook) ?? [])].sort((a, b) => a - b));
  let selectedChapter = $derived(chapters[0]);

  // ─────────────────────────────────────────────
  // GROUP 3: points (re-computed when selection changes)
  // ─────────────────────────────────────────────
  const datePoints = $derived(
    buildPoints(passagesForBibleRefs, selectedBook, selectedChapter,
      (p: PassageForBiblRefs) => yearByWork.get(p.jad_id))
  );
  const clusterPoints = $derived(
    buildPoints(passagesForBibleRefs, selectedBook, selectedChapter,
      (p: PassageForBiblRefs) => p.cluster?.[0])
  );

  // ─────────────────────────────────────────────
  // GROUP 4: option builder (shared by both charts)
  // ─────────────────────────────────────────────
  const makeSeries = (name: string, color: string, data: any[]) => ({
    name,
    type: "scatter",
    cursor: "pointer",
    data,
    itemStyle: { color, opacity: 0.8 },
    symbolSize: (_v: any, params: any) => 8 + params.data.count * 4,
  });

  // `points`: the data for ONE chart
  // `title`, `yAxis`, `extraLine`: the three things that differ between the charts
  function makeOption(
    points: any[],
    { title, yAxis, extraLine }: { title: string; yAxis: object; extraLine: (d: any) => string }
  ) {
    // these depend on the points, so they live HERE, not at the top of the file
    const genreCounts = new Map<string, number>();
    for (const pt of points) {
      const key = colorByGenre.has(pt.genre) ? pt.genre : "Other";
      genreCounts.set(key, (genreCounts.get(key) ?? 0) + 1);
    }
    const visibleGenres = genreList.filter((g) => genreCounts.has(g));
    const hasOther = genreCounts.has("Other");

    const xs = points.map((p) => p.value[0]);
    const xMin = xs.length ? Math.floor(Math.min(...xs)) - 1 : 0;
    const xMax = xs.length ? Math.ceil(Math.max(...xs)) : 1;

    return {
      title: { text: title, left: "center", textStyle: { fontSize: 20, color: "#581908" } },
      tooltip: {
        formatter: (params: any) => {
          const d = params.data;
          return `<strong>(#${d.jad_id.split("__")[1]}) ${d.title}</strong>
            <br/>Bible citation: ${selectedBook} ${selectedChapter},${d.verse}
            <br/>${extraLine(d)}
            <br/>Genre: ${d.genre === "minorGenre" ? "Other" : d.genre}`;
        },
      },
      legend: {
        type: "scroll",
        bottom: 10,
        data: [...visibleGenres, ...(hasOther ? ["Other"] : [])],
        formatter: (name: string) => `${name} (${genreCounts.get(name) ?? 0})`,
      },
      xAxis: {
        type: "value",
        name: "Verse",
        interval: 1,
        min: xMin,
        max: xMax,
        axisLabel: { formatter: (v: number) => String(Math.round(v)) },
      },
      yAxis, // <-- the only real difference
      grid: { left: 60, right: 60, top: 70, bottom: 80 },
      toolbox: {
        show: true, orient: "vertical", right: 30, top: 10, itemSize: 20, itemGap: 20,
        feature: {
          saveAsImage: {
            show: true, title: "Download as PNG", type: "png",
            pixelRatio: 2, backgroundColor: "#fff",
          },
        },
      },
      series: [
        ...visibleGenres.map((g) =>
          makeSeries(g, colorByGenre.get(g)!, points.filter((pt) => pt.genre === g))
        ),
        ...(hasOther
          ? [makeSeries("Other", MINOR_COLOR, points.filter((pt) => !colorByGenre.has(pt.genre)))]
          : []),
      ],
      dataZoom: [
        { type: "inside", xAxisIndex: 0, filterMode: "none", minValueSpan: 5 },
        { type: "inside", yAxisIndex: 0, filterMode: "none" },
      ],
    };
  }

  const dateOption = $derived(
    makeOption(datePoints, {
      title: `${datePoints.length} passages: ${selectedBook} ${selectedChapter} (by date)`,
      yAxis: { type: "value", name: "Year", interval: 100, min: yMin, max: yMax },
      extraLine: (d) => `Date: ${d.notBefore}–${d.notAfter}`,
    })
  );

  const clusterOption = $derived(
    makeOption(clusterPoints, {
      title: `${clusterPoints.length} passages: ${selectedBook} ${selectedChapter} (by cluster)`,
      yAxis: { type: "category", name: "Cluster", data: clusters,  axisLabel: { interval: 0 },   // 0 = show EVERY label, 1 = every second, ...
      axisTick: { interval: 0 },    // optional: a tick for every category
      splitLine: { show: true, interval: 0 }, // optional: a grid line for every category
    },
   
      extraLine: (d) => `Cluster: ${d.cluster}`,
    })
  );
  let selectedChart = $state()
  selectedChart = "date"
  const modes = [
    {value: "date", hidden: false, hint:"Switch to Bible References-Date Chart"}, 
    {value: "cluster", hidden: true, hint: "Switch to Bible References-Cluster Chart"}
  ]
</script>

<div class="flex flex-col min-w-0 gap-3 lg:p-10 p-3 border rounded-lg bg-white shadow-2xl">
  
  <div class="flex justify-between gap-4 items-start min-w-0">
    <div class="border border-gray-300 rounded-lg pl-2 pr-1 py-1 flex items-center gap-2 bg-brand-500/70">
      <label for="bible-select"
      class="text-white font-semibold text-xl">
          Bible Book
        </label>
        <select id="bible-select" bind:value={selectedBook}
        class="flex-1 text-brand-700 text-lg font-mono font-semibold rounded-lg py-1.5 px-2 bg-brand-50">
          {#each books as b}
            <option value={b}>{b}</option>
          {/each}
        </select>
         <label for="chapter-select"
            class="text-white font-semibold text-xl">
                Chapter
        </label>
        <select id="chapter-select" bind:value={selectedChapter}
        class="flex-1 text-brand-700 text-lg font-mono font-semibold rounded-lg py-1.5 px-2 bg-brand-50">
          {#each chapters as c}
            <option value={c}>{c}</option>
          {/each}
        </select>
    </div>
    <div class="justify-self-end p-2" role="group" aria-label="Select chart mode">
     {#each modes as m}
       <button
         type="button"
         onclick={() => (selectedChart = m.value)}
         title={m.hint}
         class="px-3 py-1 font-semibold first:rounded-l-md last:rounded-r-md uppercase shadow-sm
           {selectedChart === m.value
             ? 'bg-brand-700 text-white'
             : 'bg-brand-600/60 text-white hover:bg-brand-500'}"
       >
         {m.value}
       </button>
     {/each}
   </div>
</div>
    <EChart option={dateOption}  group="refs" class={selectedChart === "cluster" ? "hidden" : "w-full h-225"} />
    <EChart option={clusterOption} group="refs" class={selectedChart === "date" ? "hidden" : "w-full h-225"} />
     
</div>
