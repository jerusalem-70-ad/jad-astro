<script lang="ts">
  import { onMount, tick } from "svelte";
  import {withBasePath} from "@/lib/withBasePath.js";
import { selectedJadId } from "@/stores/jad_store";
  
  let selectedPassages = [];
  let inputId = "";
  let selected = null;
  let loading = false;
  let error = null;
  let statusMessage = ""
  
onMount(() => {
  const unsubscribe = selectedJadId.subscribe(async (id) => {
    if (!id) return;

    loading = true;
    error = null;

    const foundPassage = await findPassageById(id);

    if (foundPassage) {
      selectedPassages = [...selectedPassages, foundPassage];
      statusMessage = `Passage ${foundPassage.id} added.`;
    } else {
      error = "Passage not found.";
    }

    loading = false;
  });

  return unsubscribe;
});
async function findPassageById(id: string) {
  try {
      console.log(`searching for ${id}`)
      const response = await fetch(withBasePath(`/data/passages/${id}.json`));
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
      if (!selectedPassages.some(p => p.id === foundPassage.id)) {
  selectedPassages = [...selectedPassages, foundPassage];
}
      statusMessage = `Passage ${foundPassage.id} added.`;
       await tick(); //  wait for DOM update
     const card = document.getElementById(`card-${foundPassage.id}`);
const link = card?.querySelector("h2 a");

link?.focus();
      inputId = "";
      error = null;
    } else {
      error = "Passage not found.";
      statusMessage = `Passage ${inputIdTrimmed} not found.`;
    }
    loading = false;
  };  

  function removePassage(id: string) {
    selectedPassages = selectedPassages.filter(p => p.id !== id);
    statusMessage = `Passage ${id} removed.`;
  }

</script>




  {#if error}
    <p class="text-brand-600 font-bold">{error}</p>
  {/if}
  <p class="sr-only" aria-live="polite">
  {statusMessage}
</p>
 <div class="w-full grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 items-start">
      {#each selectedPassages as passage}    
      <div id="card-{passage.id}" class={`grid gap-4 border border-neutral-300 rounded-md bg-brand-50`} >
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
            <button onclick={() => removePassage(passage.id)}
                class="font-bold cursor-pointer">
              <span>✕</span><span class="sr-only">Remove passage</span>
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