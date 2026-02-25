<script>
  import { onMount } from "svelte";
  import {withBasePath} from "@/lib/withBasePath.js";

  let passages = [];
  let selectedPassages = [];
  let inputId = "";
  let selected = null;
  let loading = true;
  let error = null;

  onMount(async () => {
    try {
      const res = await fetch(withBasePath("/data/passages.json"));
      passages = await res.json();
    } catch (e) {
      error = "Failed to load passages.";
    } finally {
      loading = false;
    }
  });

 function loadPassage() {
  const found = passages.find(
    (p) => String(p.id) === inputId
  );

  if (found) {
    selectedPassages = [...selectedPassages, found];
    inputId = "";
    error = null;
  } else {
    error = "Passage not found.";
  }
}
</script>

{#if loading}
  <p>Loading data...</p>
{:else}
<form on:submit|preventDefault={loadPassage} class="my-4 flex gap-2">
  <input
    bind:value={inputId}
    placeholder="Enter passage ID"
    class="border border-neutral-300 rounded-md p-2"
  />

  <button
    type="submit"
    class="bg-brand-650 text-brand-50 hover:bg-brand-400 px-3 py-1 rounded-sm"
  >
    Show additional passage
  </button>
</form>

  {#if error}
    <p>{error}</p>
  {/if}
 <div class="w-full grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-3 items-start">
      {#each selectedPassages as passage}
      <div class={`grid gap-4 border border-neutral-300 rounded-md bg-brand-50`}>
        <h2 class="text-lg text-brand-50 bg-brand-650 p-4 flex justify-between">
            <a
            href={`${withBasePath(`/text-comparisons/${passage.jad_id}`)}`}
            class="font-semibold underline underline-offset-4 hover:text-brand-200 transition"
            >
            (#{passage.id})
            {passage.work?.[0]?.author?.length > 0
                ? `${passage.work[0].author[0].name}: ${passage.work[0].title} (${passage.position_in_work})`
                : passage.work?.[0]?.title || "N/A"}
            </a>
        </h2>
    
        <div class="text-brand-700 italic p-4 max-h-[500px] overflow-y-auto">
            {passage.text_paragraph || "No text available."}
        </div>
    
        <a
            href={`${withBasePath(`/passages/${passage.jad_id}`)}`}
            class="text-brand-600 underline underline-offset-4 decoration-dotted pb-3 pr-3 justify-self-end font-small hover:text-brand-950  transition"
        >
            See passage details
        </a>
    </div>
    {/each}
</div>

{/if}