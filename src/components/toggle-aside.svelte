<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title = "",
    aside,
    main, children
  }: {
    title?: string;
    aside?: Snippet;
    main?: Snippet;
    children? : Snippet
  } = $props();

  let showAside = $state(true);
</script>

<div
  class="grid transition-all duration-300 {showAside ? 'grid-cols-[16rem_1fr]' : 'grid-cols-[3rem_1fr]'} gap-2 items-start"
>
  <!-- Left column: toggle button + filter panel -->
  <div class="sticky top-25 grid content-start gap-0.5">
    <button
      type="button"
      onclick={() => (showAside = !showAside)}
      aria-expanded={showAside}
      aria-controls="filter-aside"
      aria-label={showAside ? "Hide filters" : "Show filters"}
      class="m-3 mt-3 flex cursor-pointer items-center gap-2 self-start rounded-md bg-brand-650 px-3 py-2
             text-lg font-semibold text-white transition hover:bg-brand-500
             {showAside ? 'justify-between' : 'w-10 flex-col justify-center'}"
    >
      {#if showAside}
        <span>FILTER</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      {:else}
        <div class="h-[calc(100vh-9rem)]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="rotate-180 leading-none whitespace-nowrap [writing-mode:vertical-rl]">FILTER</span>
        </div>
      {/if}
    </button>

    <!-- Hidden with CSS, NOT {#if}: the search panel must stay mounted
         because it runs the Typesense query that feeds the charts. -->
    <div
      id="filter-aside"
      class="sticky top-25 max-h-[calc(100vh-9rem)] overflow-y-auto px-3 {showAside ? '' : 'hidden'}"
    >
      {@render aside?.()}
    </div>
  </div>

  <!-- Main area: min-w-0 lets this grid item shrink instead of overflowing -->
 
    
    {@render main?.()}
</div>