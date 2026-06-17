<script lang="ts">
import { filters } from "@/stores/jad_store.ts";

export let title: string;
export let items: { name: string}[];
export let counts: Record<string, number> = {};
export let field: string;   // which filter field to update

let query = "";
let visibleCount = 5;
$: currentFilters = $filters;
$: operator = currentFilters.operators?.[field] ?? "OR";
$: filteredItems = items
  .filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    (currentFilters[field] ?? []).includes(a.name.toLowerCase())
  )
  .sort((a, b) => {
    const countA = counts[a.name] ?? 0;
    const countB = counts[b.name] ?? 0;

    return countB - countA;
  });

$: visibleItems = filteredItems.slice(0, visibleCount);
$: selected = currentFilters[field] ?? [];

function toggle(name: string) {

  const value = name.toLowerCase();

 filters.update(f => {
  const list = f[field] ?? [];

  return {
    ...f,
    [field]: list.includes(value)
      ? list.filter(v => v !== value)
      : [...list, value].sort()
  };
});
}

function setOperator(value: "AND" | "OR") {
  filters.update(f => ({
    ...f,
    operators: {
      ...f.operators,
      [field]: value
    }
  }));
}

function showMore() {
  visibleCount += 5;
}

function showLess() {
  if(visibleCount > 5) {
    visibleCount -= 5;
  };
}
</script>

<div class="text-xs border border-neutral-200 shadow-xs bg-brand-100 rounded-md p-2">
<details>
  <summary class="flex justify-between gap-2 font-semibold cursor-pointer uppercase">
    <h3 class="font-semibold ">{title}</h3>  
    <svg
        class="w-4 h-4 text-neutral-500 group-open:rotate-180 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"                >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </summary>
  

  
  <div class="max-h-72 overflow-y-auto pr-1">
 <input
    type="search"
    aria-label={`Search ${title}`}
    bind:value={query}
    placeholder={`Search ${title.toLowerCase()}...`}
    class="mt-2 p-2 border border-neutral-300 rounded-md w-full bg-white"
  />

  <ul class="mt-2 space-y-1">
    {#each visibleItems as item}
      <li>
        <label for={`${field}-${item.name}`} class="flex items-center gap-2">
         <input
            id={`${field}-${item.name}`}
            type="checkbox"
            disabled={
              (counts[item.name] ?? 0) === 0 &&
              !selected.includes(item.name.toLowerCase())
            }
            checked={(currentFilters[field] ?? []).includes(
                item.name.toLowerCase()
              )}
            on:change={() => toggle(item.name)}
            />
          <span>
            {item.name}
            <span class="text-neutral-700">
              ({counts[item.name] ?? 0})
            </span>
            </span>
        </label>
      </li>
    {/each}
  </ul>
   <div class="flex justify-between px-2 py-1">
     {#if visibleCount < filteredItems.length}
        <button
          type="button"
          on:click={showMore}
          class="mt-2 text-brand-700 cursor-pointer underline underline-offset-2 hover:to-brand-500"
        >
          Show more
        </button>
      {/if}
      {#if visibleCount > 5}
      <button
          type="button"
          on:click={showLess}
          class="mt-2 text-brand-700 cursor-pointer underline underline-offset-2 hover:to-brand-500"
        >
          Show less
        </button>
      {/if}
   </div>
  <div class="flex gap-1 justify-end place-items-center">
    <span>Searching mode:</span>
    <button
    type="button"
    class={`px-2 py-1 rounded text-xs border cursor-pointer ${
      operator === "OR"
        ? "bg-brand-600 text-white border-brand-600"
        : "bg-white border-neutral-300"
    }`}
    on:click={() => setOperator("OR")}
  >
    OR
  </button>
  <button
    type="button"
    class={`px-2 py-1 rounded text-xs border cursor-pointer ${
      operator === "AND"
        ? "bg-brand-600 text-white border-brand-600"
        : "bg-white border-neutral-300"
    }`}
    on:click={() => setOperator("AND")}
  >
    AND
  </button>
  </div>
  </div>
</details>
</div>