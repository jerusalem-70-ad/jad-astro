<script lang="ts">
  import { withBasePath } from "@/lib/withBasePath";
  import {extractBookAbbreviation,
  parseChapterVerse, NOVA_VULGATA_ORDER} from "@/lib/search/utils.js";
  import * as echarts from "echarts";
import { onMount } from "svelte";


  let { passagesForBibleRefs } = $props();
  let container: HTMLDivElement; 
let chart: echarts.ECharts | null = null;

  // 1: make a Map off all occuring Bible Books+chapter to use in the Select elements
  const booksMap = new Map<string, Set<number>>();
  
    for (const p of passagesForBibleRefs) {
    for (const ref of p.biblRefs) {
       const book = extractBookAbbreviation(ref)
       if (!book) continue;

        const { chapter } = parseChapterVerse(ref, book);
        if (chapter === null) continue;

       if(!booksMap.has(book)) {
        booksMap.set(book, new Set())        
       }
       booksMap.get(book)!.add(chapter);
    }
  }

  // One random year per work, computed ONCE when the component is created.
// key = jad_id, value = a year between notBefore and notAfter
const yearByWork = new Map<string, number>();

const genres = new Set<string>(); //in the preprocess we took only the top 10 genres, 
// if p has another it ended up with genre: minorGenre

for (const p of passagesForBibleRefs) {
  const { notBefore, notAfter } = p.date[0];
  const year = Math.round(notBefore + Math.random() * (notAfter - notBefore));
  yearByWork.set(p.jad_id, year);
  if (p.genre != "minorGenre") genres.add(p.genre)
}
// palette for the top 10 genres
const PALETTE = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
  "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#17becf",
];
const MINOR_COLOR = "#bdbdbd"; // gray for "minorGenre"

// Set -> sorted array, so each genre always gets the same color
const genreList = [...genres].sort((a, b) => a.localeCompare(b));

// genre -> color
const colorByGenre = new Map<string, string>(
  genreList.map((g, i) => [g, PALETTE[i]])
);

  // 1a. use the Nova vulgara order (imported) to sort the set-> array
  const rank = (book: string): number =>
    NOVA_VULGATA_ORDER[book as keyof typeof NOVA_VULGATA_ORDER] ?? Number.MAX_SAFE_INTEGER;

  const books = [...booksMap.keys()].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b)
  );

  let selectedBook = $state(books[0]);

 // Chapters: recalculated automatically when the book changes.
// Sets/Maps keep insertion order, not numeric order, so we sort numerically.
// Note: (a, b) => a - b. A plain .sort() would sort as text (1, 10, 2...).
const chapters = $derived(
  [...(booksMap.get(selectedBook) ?? [])].sort((a, b) => a - b)
);


let selectedChapter = $derived(chapters[0]);
 // 2. Prepare the data for the graph scatter need array of arrays 
 // [x,   y,    extra values (count, title, range)
 //[19, 715.5,   4, "Beda, Commentary Luke", 701, 730],

 // Helper: "Lk > 019|19"  ->  { book: "Lk", chapter: 19 }
const parseRef = (ref: string) => {
  const [book, rest] = ref.split(">").map((s) => s.trim());
  const chapter = Number(rest?.split("|")[1]); 
  return { book, chapter };
};

// Global year range, computed ONCE, so the y-axis stays stable between books
const allYears = passagesForBibleRefs.flatMap((p) =>
  p.date.flatMap((d) => [d.notBefore, d.notAfter])
);
const yMin = Math.min(...allYears);
const yMax = Math.max(...allYears);

// Recomputed automatically whenever `selected` changes
const points = $derived.by(() => {
  const grouped = new Map();

  for (const p of passagesForBibleRefs) {
    const { notBefore, notAfter } = p.date[0];
    const year = yearByWork.get(p.jad_id)!; // random year, computed once earlier

    for (const ref of p.biblRefs) {
      if (extractBookAbbreviation(ref) !== selectedBook) continue;

      const { chapter, verse } = parseChapterVerse(ref, selectedBook);
      if (chapter !== selectedChapter || !verse) continue; // the second filter

      const verseNum = parseInt(verse.split("-")[0]); // "41-44" -> 41

      const key = `${p.jad_id}|${verseNum}`;
      const entry = grouped.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        grouped.set(key, {
          jad_id: p.jad_id, verse, verseNum, year, count: 1,
          title: p.workTitle, notBefore, notAfter,
          genre: p.genre, 
        });
      }
    }
  }  

  return [...grouped.values()].map((v) => ({
    value: [v.verseNum, v.year], // x = verse, y = year
    jad_id: v.jad_id,
    verse: v.verse,
    count: v.count,
    title: v.title,
    notBefore: v.notBefore,
    notAfter: v.notAfter,
    genre: v.genre,
  }));
});
const genreCounts = $derived.by(() => {
  const m = new Map<string, number>();
  for (const pt of points) {
    // genres without a color are counted together as "Other"
    const key = colorByGenre.has(pt.genre) ? pt.genre : "Other";
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
});
const visibleGenres = $derived(genreList.filter((g) => genreCounts.has(g)));
const hasOther = $derived(genreCounts.has("Other"));

// helper: one series definition per genre
const makeSeries = (name: string, color: string, data: any[]) => ({
  name,
  type: "scatter",
  cursor: "pointer",
  data,
  itemStyle: { color, opacity: 0.8 },
  symbolSize: (_value: any, params: any) => 8 + params.data.count * 4,
});

// derived: the chart option
const option = $derived({
    tooltip: {
        formatter: (params) => {
            const d = params.data;
            return `<strong>(#${d.jad_id.split("__")[1]}) ${d.title}</strong>
            <br/>Bible citation: ${selectedBook} ${selectedChapter},${d.verse}
            <br/>Date: ${d.notBefore}–${d.notAfter}
            </br>Genre: ${d.genre == "minorGenre" ? "Other" : d.genre}`;
        },
    },
    title: {
        text: `${points.length} passages with reference to ${selectedBook}: ${selectedChapter}`,
      
      left: "center",
      textStyle: { fontSize: 20, color: "#581908"},
    },
     legend: {
        type: "scroll",
        bottom: 10,
        data: [...visibleGenres, ...(hasOther ? ["Other"] : [])],
        formatter: (name: string) => `${name} (${genreCounts.get(name) ?? 0})`,
    },
    xAxis: { type: "value", 
        name: "Verse", 
        interval: 1,            // no 0.5 steps
        // show range from first to last occurrence with a bit on the side
        min: (range: { min: number }) => Math.floor(range.min) - 0.2,
        max: (range: { max: number }) => Math.ceil(range.max) + 0.2,
        axisLabel: {
            formatter: (v: number) => String(Math.round(v)),
            },
        },
    yAxis: { type: "value", name: "Year", min: 100, max: yMax  ,  
        interval: 100,
        min: 100,
        max: Math.ceil(yMax / 100) * 100,   // e.g. 1487 -> 1500
        axisLabel: { formatter: (v: number) => String(Math.round(v)) },
        },
     grid: { left: 60, right: 60, top: 70, bottom: 80 },
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
    series: [
        // the 10 main genres, in color
    ...visibleGenres.map((g) =>
      makeSeries(g, colorByGenre.get(g)!, points.filter((pt) => pt.genre === g))
    ),
    // everything else, in gray
    ...(hasOther
      ? [makeSeries("Other", MINOR_COLOR, points.filter((pt) => !colorByGenre.has(pt.genre)))]
      : []),
  ],
   
  dataZoom: [
    // mouse
    { type: "inside", xAxisIndex: 0, filterMode: "none" },
    { type: "inside", yAxisIndex: 0, filterMode: "none" },

   
  ],
});

onMount(() => {
  chart = echarts.init(container);
    
  chart.on("click", (params: any) => {
    if (params.data) {
      window.location.href = withBasePath(
        `/data/passages/${params.data.jad_id}`
      );
    }
  });

    const ro = new ResizeObserver(() => chart?.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart?.dispose();
      chart = undefined;
    };
});

 // update whenever `option` changes (i.e. when `selected` changes)
  $effect(() => {
    chart?.setOption(option, true); // true = replace old data, don't merge
  });

</script>
<div class="flex flex-col min-w-0 gap-3 lg:p-10 p-3 border rounded-lg bg-white shadow-2xl">
  
  <div class="flex flex-col gap-4 items-start min-w-0">
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
      <div
        bind:this={container}
        class="w-full h-225"
    >
  </div>
  </div>
</div>