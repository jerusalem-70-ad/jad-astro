<script lang="ts">
  import { filters, defaultFilters } from "@/stores/jad_store.js";
  import type { Filters } from "@/types/store";

  // Keys of Filters whose value is a string[] (authors, works, ..., rec_id).
  // "query" (string) and "operators" (object) are excluded automatically.
  type ListKey = {
    [K in keyof Filters]: Filters[K] extends string[] ? K : never;
  }[keyof Filters];

  // Keys that have an AND/OR operator (rec_id has none)
  type OperatorKey = keyof Filters["operators"];

  // Record<ListKey, string> forces a label for EVERY list filter.
  // If you add a filter to the store, TypeScript flags this object until you add a label.
  const LABELS: Record<ListKey, string> = {
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

  // Fixed display order
  const FILTER_KEYS = Object.keys(LABELS) as ListKey[];

  let activeFilters = $derived(
    FILTER_KEYS.filter((key) => $filters[key].length > 0).map(
      (key) => [key, $filters[key]] as const
    )
  );

  function operatorFor(field: ListKey): string {
    // rec_id is not in operators, so the cast is needed and the fallback applies
    return $filters.operators[field as OperatorKey] ?? "OR";
  }

  function resetFilters() {
    filters.set(structuredClone(defaultFilters));
  }

  function removeValue(field: ListKey, value: string) {
    filters.update((f) => ({
      ...f,
      [field]: f[field].filter((v) => v !== value)
    }));
  }
</script>

<div
  class="flex min-h-12 items-center gap-3 rounded-lg border border-brand-200 border-l-4 border-l-brand-400
         bg-white px-3 py-2 text-sm shadow-sm"
>
  {#if activeFilters.length === 0}
    <p class="text-neutral-600">No filters active, showing all passages.</p>
  {:else}
    <span
      class="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white"
      title="Active filter groups"
    >
      {activeFilters.length}
    </span>

    <ul class="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
      {#each activeFilters as [field, values] (field)}
        <li class="flex flex-wrap items-center gap-1.5">
          <strong class="text-xs font-semibold tracking-wide text-brand-700 uppercase">
            {LABELS[field]}
          </strong>

          {#each values as value, i (value)}
            {#if i > 0}
              <span class="text-[10px] font-bold text-brand-350">{operatorFor(field)}</span>
            {/if}
            <span
              class="inline-flex items-center gap-1 rounded-full border border-brand-300/60 bg-brand-100 py-0.5 pr-1 pl-2.5
                     font-medium text-brand-800"
            >
              {value}
              <button
                type="button"
                onclick={() => removeValue(field, value)}
                aria-label="Remove {value} from {LABELS[field]}"
                class="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-brand-600
                       hover:bg-brand-500 hover:text-white"
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
      class="shrink-0 cursor-pointer rounded-md border border-brand-500 px-3 py-1.5 font-semibold text-brand-500
             transition hover:bg-brand-500 hover:text-white"
    >
      Reset
    </button>
  {/if}
</div>