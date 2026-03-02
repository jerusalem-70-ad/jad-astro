<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';

  let {
    title = "JAD",
    aside,
    main,
    children
  }: {
    title?: string;
    aside?: Snippet;
    main?: Snippet;
    children?: Snippet;
  } = $props();  

   let showAside = $state(false); 
   let mobile = $state(false);

  function checkScreen() {
    mobile = window.innerWidth < 768;

    // open by default on desktop
    if (!mobile) {
      showAside = true;
    }
  }

  onMount(() => {
    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  });
</script>

<div
  class="grid transition-all duration-300"
  class:grid-cols-1={mobile}
  class:grid-cols-[16rem_1fr]={!mobile && showAside}
  class:grid-cols-[3rem_1fr]={!mobile && !showAside}
>
  <div class="grid content-start gap-2">
    <button
      onclick={() => (showAside = !showAside)}  
      class="self-start flex justify-between gap-2 mt-3 m-3 font-semibold text-lg 
             bg-brand-650 text-white px-3 py-2 rounded-md 
             hover:bg-brand-500 transition"
      class:w-10={!showAside && !mobile}
      class:grid={!showAside}
      class:pr-5={!showAside}
    >
      {#if showAside}
        <span>Hide search</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      {:else}
      {#if mobile}
        <span>Filter</span>
     
      {:else}
       <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap leading-none">Show search</span>        
      {/if}
      {/if}
    </button>

    {#if showAside}
      {@render aside?.()}
    {/if}
  </div>

  <div class="w-[calc(100%-1.5rem)] my-3 mx-auto p-3 bg-white md:border border-neutral-300 rounded-md grid grid-rows-[auto_auto_1fr_auto]">
    <h1 class="font-bold text-brand-800 text-lg md:text-2xl px-6 py-6 border-neutral-300 border-b-2">{title}</h1>
    {@render main?.()}
  </div>
</div>