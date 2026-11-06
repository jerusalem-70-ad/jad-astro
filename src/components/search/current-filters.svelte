<script lang="ts">
  import { filters, defaultFilters } from "@/stores/jad_store.js";

  // Nicer labels than the raw store keys. Unknown keys fall back to the key itself.
  const LABELS: Record<string, string> = {
    authors: "Authors",
    works: "Works",
    genres: "Genres",
    keywords: "Keywords",
    place: "Place",
    century: "Century",
    lit_ref: "Liturgical references",
    bibl_ref: "Biblical references",
    manuscripts: "Manuscripts",
    rec_id: "Passage ID"
  };

  // Only the filters that actually have values
  let activeFilters = $derived(
    Object.entries($filters).filter(
      ([key, value]) =>
        key !== "operators" &&
        key !== "query" &&
        Array.isArray(value) &&
        value.length > 0
    )
  );

  function resetFilters() {
    filters.set(structuredClone(defaultFilters));
  }

  // Remove ONE value from one filter, e.g. "Typology" from keywords
  function removeValue(field: string, value: string) {
    filters.update((f) => ({
      ...f,
      [field]: f[field].filter((v: string) => v !== value)
    }));
  }
</script>

<div
  class="flex min-h-11 items-center gap-3 rounded-md border border-neutral-200 bg-brand-100/40 px-3 py-2 text-sm shadow-xs"
>
  {#if activeFilters.length === 0}
    <p class="text-neutral-600">No filters active, showing all passages.</p>
  {:else}
    <ul class="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
      {#each activeFilters as [field, values] (field)}
        <li class="flex flex-wrap items-center gap-1">
          <strong class="text-brand-900">{LABELS[field] ?? field}:</strong>

          {#each values as value, i (value)}
            {#if i > 0}
              <span class="text-xs font-semibold text-neutral-500">
                {$filters.operators?.[field] ?? "OR"}
              </span>
            {/if}
            <span
              class="inline-flex items-center gap-1 rounded-full bg-brand-600 py-0.5 pr-1 pl-2 text-white"
            >
              {value}
              <button
                type="button"
                onclick={() => removeValue(field, value)}
                aria-label="Remove {value} from {LABELS[field] ?? field}"
                class="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full leading-none hover:bg-brand-400"
              >
                ×
              </button>
            </span>
          {/each}
        </li>
      {/each}
    </ul>

    <button
      type="button"
      onclick={resetFilters}
      class="shrink-0 cursor-pointer rounded-md bg-brand-600 px-3 py-1.5 font-bold text-white hover:bg-brand-500"
    >
      Reset
    </button>
  {/if}
</div>