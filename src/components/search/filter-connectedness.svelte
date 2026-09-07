<script lang="ts">
  import { filters } from "@/stores/jad_store.ts";

  export let title: string;
  export let field: string = "connectedness";

  const min = 0;
  const max = 30;

  $: currentValue = Number($filters[field]?.[0] ?? min);

  function updateConnectedness(value: string) {
    const number = Number(value);

    if (!Number.isInteger(number)) return;

    filters.update(f => ({
      ...f,
      [field]: number === min ? [] : [String(number)]
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

    <div class="mt-3 px-1">
      <div class="flex justify-between items-center mb-2">
        <span>Minimum connectedness</span>

        <span class="font-semibold text-brand-700">
          {currentValue}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={currentValue}
        aria-label={title}
        on:input={(event) =>
          updateConnectedness(
            (event.currentTarget as HTMLInputElement).value
          )}
        class="w-full cursor-pointer accent-brand-600"
      />

      <div class="flex justify-between text-neutral-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  </details>
</div>