<script lang="ts">
  let {
    title,
    what,
    how,
    why,
    questions,
    mode = "featured"
  }: {
    title: string;
    what?: string;
    how?: string;
    why?: string;
    questions?: string;
    mode?: "card" | "featured";
  } = $props();

  let isCard = $derived(mode === "card");
</script>

<div class="flex items-start gap-2 {isCard ? 'mb-2' : 'mb-4'}">
  <h2 class="font-semibold text-brand-950 {isCard ? 'text-sm' : 'text-2xl'}">
    {title}
  </h2>

  <span class="group relative inline-block">
    <span
      aria-hidden="true"
      class="inline-block rounded-full text-brand-950 hover:bg-brand-800 hover:text-brand-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="{isCard ? 'h-4 w-4' : 'h-6 w-6'}"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    </span>
    <span class="sr-only">Definition des Begriffes</span>

    {#if what || how || why || questions}
      <span
        class="invisible group-hover:visible absolute top-0 z-50 w-96 rounded-md bg-brand-900/90 p-3 text-sm text-brand-50
               {isCard ? 'right-full mr-2' : 'left-8 md:text-base'}"
      >
        <dl class="grid grid-cols-[1fr_5fr]">
          {#if what}
            <dt class="mr-2 font-semibold">What:</dt>
            <dd class="font-light">{what}</dd>
          {/if}
          {#if how}
            <dt class="mr-2 font-semibold">How:</dt>
            <dd class="font-light">{how}</dd>
          {/if}
          {#if why}
            <dt class="mr-2 font-semibold">Why:</dt>
            <dd class="font-light">{why}</dd>
          {/if}
          {#if questions}
            <dt class="mr-2 font-semibold">Questions:</dt>
            <dd class="font-light">{questions}</dd>
          {/if}
        </dl>
      </span>
    {/if}
  </span>
</div>