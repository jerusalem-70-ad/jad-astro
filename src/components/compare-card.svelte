<script lang="ts">
  import { onMount } from "svelte";
  import {withBasePath} from "@/lib/withBasePath.js";

  
  let selectedPassages = [];
  let inputId = "";
  let selected = null;
  let loading = false;
  let error = null;

  

async function findPassageById(id: string) {
  try {
    const response = await fetch(withBasePath(`/data/passages/jad_occurrence__${id}.json`));
    if (!response.ok) {
      throw new Error("Passage not found");
    }
    return await response.json();
  } 
  catch (error) {
    console.error("Error fetching passage:", error);
    return null;  
  }
}


 async function loadPassage(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement}) {
		event.preventDefault(); 
  loading = true;
  error = null;
  const inputIdTrimmed = inputId.trim();
  if (!inputIdTrimmed) {
    error = "Please enter a passage ID.";
    loading = false;
    return;
  }

  const foundPassage = await findPassageById(inputIdTrimmed);
    if (foundPassage) {
      selectedPassages = [...selectedPassages, foundPassage];
      inputId = "";
      error = null;
    } else {
      error = "Passage not found.";
    }
    loading = false;
  };  

</script>


<form onsubmit={loadPassage} class="my-4 flex gap-2">
  <label for="passageId" class="sr-only">Passage ID:</label>
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
      <div id="card-{passage.id}" class={`grid gap-4 border border-neutral-300 rounded-md bg-brand-50`}>
        <h2 class="text-lg text-brand-50 bg-brand-650 p-4 flex justify-between">
            <a
            href={`${withBasePath(`/text-comparisons/${passage.jad_id}`)}`}
            class="font-semibold underline underline-offset-4 hover:text-brand-200 transition"
            >
            (#{passage.id})
            {passage.work?.[0]?.author
                ? `${passage.work[0].author}: ${passage.work[0].title} (${passage.position_in_work})`
                : passage.work?.[0]?.title || "N/A"}
            </a>
            <button onclick={() => {
                selectedPassages = selectedPassages.filter(p => p.id !== passage.id)}}
                class="text-sm text-white cursor-pointer">
              Remove
            </button>
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

 {#if loading}
      <div class="flex items-center justify-center gap-2 ">
        <span class="text-brand-650">Loading ... </span>
        <span class="loader"></span>
      </div>
    {/if}