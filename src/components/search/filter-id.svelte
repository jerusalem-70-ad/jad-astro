<script lang="ts">
  import { filters } from "@/stores/jad_store.ts";

  export let title: string;
  export let field: string = "sort_id";

  $: currentValue = $filters[field]?.[0] ?? "";

  function updatePassageId(value: string) {
    // Empty input = remove the filter
    if (value.trim() === "") {
      filters.update(f => ({
        ...f,
        [field]: []
      }));
      return;
    }

    // Keep only a numeric value
    const id = Number(value);

    if (!Number.isInteger(id) || id < 0) return;

    filters.update(f => ({
      ...f,
      [field]: [String(id)]
    }));
  }
</script>

<div class="text-xs border border-neutral-200 shadow-xs bg-brand-700/10 rounded-md p-2">
  <details>
    <summary class="flex justify-between gap-2 font-semibold cursor-pointer uppercase">
      <h3 class="font-semibold">{title}</h3>

      <svg
        class="w-4 h-4 text-neutral-500 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </summary>

    <div class="mt-2">
      <input
        type="number"
        min="0"
        step="1"
        aria-label={title}
        value={currentValue}
        on:input={(event) =>
          updatePassageId((event.currentTarget as HTMLInputElement).value)
        }
        placeholder={`Enter ${title.toLowerCase()}...`}
        class="p-2 border border-neutral-300 rounded-md w-full bg-white"
      />
    </div>
  </details>
</div>