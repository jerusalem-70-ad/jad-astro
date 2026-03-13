<script lang="ts">
import { filters } from "@/stores/jad_store.js";

export let title: string;
export let items: { name: string; count?: number }[];
export let field: string;   // which filter field to update

let query = "";
$: currentFilters = $filters;
$: filteredItems = items
  .filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    currentFilters[field].includes(a.name.toLowerCase())  // keep selected facet in the itemlist
  )
  .slice(0, 5);

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
</script>

<div class="filter">
  <h3 class="font-semibold mb-2">{title}</h3>
  
 <input
    type="search"
    aria-label={`Search ${title}`}
    bind:value={query}
    placeholder={`Search ${title.toLowerCase()}...`}
    class="p-2 border border-neutral-300 rounded-md w-full"
  />

  <ul class="mt-2 space-y-1">
    {#each filteredItems as item}
      <li>
        <label for={`${field}-${item.name}`} class="flex items-center gap-2">
         <input
            id={`${field}-${item.name}`}
            type="checkbox"
            checked={currentFilters[field].includes(item.name.toLowerCase())}
            on:change={() => toggle(item.name)}
            />
          <span class="text-sm">
            {item.name}
            {#if item.count}
                <span class="text-neutral-700">({item.count})</span>
            {/if}
            </span>
        </label>
      </li>
    {/each}
  </ul>
</div>