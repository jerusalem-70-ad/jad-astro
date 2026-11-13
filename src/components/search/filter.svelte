<script lang="ts">
import { filters } from "@/stores/jad_store.ts";
import type { OperatorKey } from "@/types/store";

export let title: string;
export let items: { name: string}[];
export let counts: Record<string, number> = {};
export let field: OperatorKey;   // which filter field to update
export let operatorMode: boolean = true; 
export let help: string = ""; 

const id = title.toLowerCase().replace(/\W+/g, '-')

let query = "";
let visibleCount = 5;

const getFilterValues = (filtersState: Record<string, any>, key: string) =>
  ((filtersState[key] ?? []) as string[]);

$: currentFilters = $filters;
$: filteredItems = items
  .filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      selected.includes(a.name.toLowerCase())
  )
  .sort((a, b) => {
    // 1) selected items first, so they never fall behind "Show more"
    const selA = selected.includes(a.name.toLowerCase()) ? 1 : 0;
    const selB = selected.includes(b.name.toLowerCase()) ? 1 : 0;
    if (selA !== selB) return selB - selA;

    // 2) then by count, highest first
    return (counts[b.name] ?? 0) - (counts[a.name] ?? 0);
  });

$: visibleItems = filteredItems.slice(0, visibleCount);
$: selected = getFilterValues(currentFilters as Record<string, any>, field);


  $: operator = currentFilters.operators?.[field as OperatorKey] ?? "OR";
  $: excluded = currentFilters.excludes?.[field as OperatorKey] ?? false;

  // One value that describes the whole control: "OR" | "AND" | "NOT"
  $: mode = excluded ? "NOT" : operator;


type Mode = "OR" | "AND" | "NOT";

  // NOT is always available, OR/AND only when operatorMode is true
  $: visibleModes = (operatorMode ? ["OR", "AND", "NOT"] : ["NOT"]) as Mode[];


  function setMode(next: Mode) {
    const key = field as OperatorKey;

    filters.update((f) => {
       if (next === "NOT") {
        return {
          ...f,
          excludes: { ...f.excludes, [key]: !f.excludes[key] },
        };
      }

      // Clicking OR/AND sets the operator AND turns NOT off, in ONE update
      return {
        ...f,
        operators: { ...f.operators, [key]: next },
        excludes: { ...f.excludes, [key]: false },
      };
    });
  }

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


function showMore() {
  visibleCount += 5;
}

function showLess() {
  if(visibleCount > 5) {
    visibleCount -= 5;
  };
}
</script>

<div class="text-xs border border-neutral-200 shadow-xs bg-brand-700/10 rounded-md p-2">
<details class="group">
  <summary class="flex justify-between gap-2 font-semibold cursor-pointer uppercase">
    <div class="flex items-center gap-2">
      <h3 class="font-semibold ">{title}</h3>
     {#if help}
      <button
        popovertarget="{id}-popover"
        style="anchor-name: --{id}"
        class="rounded-md border border-neutral-300 px-1 py-0.5 cursor-help uppercase"
      >
        Info
      </button>

      <div
        popover
        id="{id}-popover"
        style="position-anchor: --{id}"
        class="[position-area:bottom_span-right] rounded-md border border-neutral-200 bg-white p-2 shadow-md normal-case"
      >
        {help}
      </div>
    {/if}
    </div>  
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
            checked={getFilterValues(currentFilters as Record<string, any>, field).includes(
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
  <span>{operatorMode ? "Searching mode:" : "Filter:"}</span>
  {#each visibleModes as m}
    <button
      type="button"
      aria-pressed={mode === m}
      class={`px-2 py-1 rounded text-xs border cursor-pointer ${
        mode === m
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white border-neutral-300"
      }`}
      on:click={() => setMode(m)}
    >
      {m}
    </button>
  {/each}
</div>
  </div>
</details>
</div>

