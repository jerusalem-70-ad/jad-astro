
<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Info from "@lucide/svelte/icons/info";

  export let mode: "card" | "featured" = "featured";
  export let title: string;
  export let what = "";
  export let how = "";
  export let why = "";
  export let questions = "";

  $: isCard = mode === "card";

  // Only the rows that have text, so the template needs no repeated {#if}
  $: items = [
    ["What:", what],
    ["How:", how],
    ["Why:", why],
    ["Questions:", questions],
  ].filter(([, text]) => text);

  $: hasInfo = items.length > 0;

  // Must be unique on the page: the same title can exist as card and as featured
  $: id = `${title.toLowerCase().replace(/\W+/g, "-")}-${mode}`;

  let popoverEl: HTMLElement | undefined;

  // Card mode: the whole card is a <button>, and a button inside a button is
  // invalid HTML, so there the popover opens on hover instead of on click.
  function show() {
    if (popoverEl && !popoverEl.matches(":popover-open")) popoverEl.showPopover();
  }
  function hide() {
    if (popoverEl?.matches(":popover-open")) popoverEl.hidePopover();
  }
</script>

<div
  class="flex items-start gap-2 rounded-md  {isCard
    ? 'justify-between mb-2 bg-brand-400 p-2'
    : 'mb-3 pl-2'}"
>
  <!-- Left side: arrow + title. min-w-0 lets a long title wrap instead of pushing the icon -->
  <div class="flex min-w-0 items-center gap-1">
    {#if isCard}
      <!-- shrink-0 stops the arrow from getting squeezed by long titles -->
      <ArrowLeft class="h-4 w-4 shrink-0 text-white" />
    {/if}
    <h2
      class="font-semibold {isCard
        ? 'text-sm text-white'
        : 'text-2xl text-brand-800'}"
    >
      {title}
    </h2>
  </div>

  {#if hasInfo}
    <!-- Right side: info icon (also shrink-0, so justify-between keeps it at the edge) -->
    {#if isCard}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span
        aria-hidden="true"
        style="anchor-name: --{id}"
        onmouseenter={show}
        onmouseleave={hide}
        class="shrink-0 rounded-full text-white"
      >
        <Info class="h-4 w-4" />
      </span>
    {:else}
      <button
        type="button"
        popovertarget="{id}-popover"
        style="anchor-name: --{id}"
        aria-label="About this visualisation: {title}"
        class="shrink-0 cursor-help rounded-full text-brand-950 hover:bg-brand-800 hover:text-brand-50"
      >
        <Info class="h-6 w-6" />
      </button>
    {/if}

    <div
      bind:this={popoverEl}
      popover={isCard ? "manual" : "auto"}
      id="{id}-popover"
      style="position-anchor: --{id}"
      class="m-0 mt-1 inset-auto w-96 max-w-[90vw] rounded-md bg-brand-900/90 p-3 text-sm text-brand-50
             [position-try-fallbacks:flip-block,flip-inline]
             {isCard
        ? '[position-area:bottom_span-left]'
        : '[position-area:bottom_span-right] md:text-base'}"
    >
      <dl class="grid grid-cols-[1fr_5fr] gap-y-1">
        {#each items as [label, text]}
          <dt class="mr-2 font-semibold">{label}</dt>
          <dd class="font-light">{text}</dd>
        {/each}
      </dl>
    </div>
  {/if}
</div>