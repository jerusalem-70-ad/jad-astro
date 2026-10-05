<script lang="ts">
  import { withBasePath } from "@/lib/withBasePath";
  import {NOVA_VULGATA_ORDER} from "@/lib/search/utils.js";

  let { passagesForBibleComm } = $props();

  // Step 1: group by Bible book. Map.groupBy needs Node 21+.
  const byBook = Map.groupBy(passagesForBibleComm, (p) => p.bible_comm_lvl0);
  const rank = (book: string): number =>
    NOVA_VULGATA_ORDER[book as keyof typeof NOVA_VULGATA_ORDER] ?? Number.MAX_SAFE_INTEGER;

  const books = [...byBook.keys()].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b)
  );

  let selected = $state(books[0]);

  // Step 2: recomputed automatically whenever `selected` changes
  const matrix = $derived.by(() => {
    const rows = byBook.get(selected) ?? [];

    const chapters = [...new Set(rows.map((p) => Number(p.bible_comm_lvl1)))]
      .sort((a, b) => a - b);

    const unsortedWorks = new Map(); // workTitle -> Map(chapter -> passage[])
    for (const p of rows) {
      const ch = Number(p.bible_comm_lvl1);
      if (!unsortedWorks.has(p.workTitle)) unsortedWorks.set(p.workTitle, new Map());
      const cells = unsortedWorks.get(p.workTitle);
      if (!cells.has(ch)) cells.set(ch, []);
      cells.get(ch).push(p);
    }
    const works = new Map(
  [...unsortedWorks.entries()].sort(([titleA], [titleB]) =>
    titleA.localeCompare(titleB)
  )
);
    return { chapters, works };
  });
</script>
<div class="flex flex-col min-w-0 gap-3 lg:p-10 p-3 border rounded-lg bg-brand-50 shadow-2xl">
  <div class="text-brand-700 min-w-3/4">
    <h2 class="text-2xl font-semibold mb-4 text-brand-950">Bible Commentaries</h2>
    <p> There are {passagesForBibleComm.length} passages in the database that comment on a book of the Bible.
  Select a book from the menu to see its passages. Each row is a commentary,
  and each column is a chapter of the selected book.
    </p>
    <p> An <strong>X</strong> marks a passage commenting on that chapter. Click it to open the passage's
  detail page. If a commentary has several passages on the same chapter, you'll see several X's.
    </p>
  </div>
  <div class="flex flex-col gap-4 items-start min-w-0">
    <div class="border border-gray-300 rounded-lg pl-2 pr-1 py-1 flex items-center gap-2 bg-brand-500/70">
      <label for="bible-select"
      class="text-white font-semibold text-xl">
          Bible Book
        </label>
        <select id="bible-select" bind:value={selected}
        class="flex-1 text-brand-700 text-lg font-mono font-semibold rounded-lg py-1.5 px-2 bg-brand-50">
          {#each books as b}
            <option value={b}>{b}</option>
          {/each}
        </select>
    </div>
     <div class="overflow-auto w-full max-w-full max-h-5/6">
       <table>
       <thead>
          <tr>
            <th class="corner sticky top-0 left-0 z-30 h-12 min-w-72 border-r border-b border-neutral-400 bg-brand-700 text-brand-50">
              <!-- diagonal line to split header -->
              <svg
                class="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <line
                  x1="0" y1="0" x2="100" y2="100"
                  stroke="#a3a3a3"
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
              <span class="absolute top-1 right-2 text-sm">Chapter</span>
              <span class="absolute bottom-1 left-2 text-sm">Commentary</span>
            </th>
            {#each matrix.chapters as ch}
              <th class="sticky top-0 z-20 min-w-16 border-r border-b border-neutral-400 bg-brand-350 text-white">
                {selected} {ch}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each [...matrix.works] as [title, cells]}
            <tr>
              <th scope="row" class="sticky left-0 bg-brand-100 font-medium border border-neutral-400 text-brand-800 py-0.5 px-1 min-w-72 text-left"
              title={title}>{title.length > 50 ? `${title.slice(0,50)} ...`: title}</th>
              {#each matrix.chapters as ch}
                <td class="border border-neutral-400 py-0.5 px-1 text-center text-brand-800">
              {#each cells.get(ch) ?? [] as passage (passage.jad_id)}
                <a
                  href={withBasePath(`/data/passages/${passage.jad_id}`)}
                  title="(#{passage.jad_id.split('__')[1]}) {title}, {selected} {ch}"
                >X</a>
              {/each}
            </td>
              {/each}
            </tr>
          {/each}
        </tbody>
           </table>
     </div>
  </div>
</div>