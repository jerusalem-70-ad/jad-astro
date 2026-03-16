<script lang="ts">
import { onMount } from "svelte";
import { withBasePath } from "@/lib/withBasePath.js";
import { selectedJadId } from "@/stores/jad_store";

let passage: any = null;
let loading = false;
let error: string | null = null;
let statusMessage = "";

onMount(() => {
  const unsubscribe = selectedJadId.subscribe(async (id) => {
    if (!id) {
      passage = null;
      return;
    }

    loading = true;
    error = null;

    const requestedPassage = await findPassageById(id);

    if (requestedPassage) {
      passage = requestedPassage;
      statusMessage = `Passage ${passage.id} loaded.`;
    } else {
      error = "Passage not found.";
      passage = null;
    }

    loading = false;
  });

  return unsubscribe;
});

async function findPassageById(id: string) {
  try {
    console.log(`searching for ${id}`);
    const response = await fetch(withBasePath(`/data/passages/${id}.json`));

    if (!response.ok) {
      throw new Error("Passage not found");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching passage:", error);
    return null;
  }
}

function closePassage() {
  passage = null;
  selectedJadId.set(null);
}
</script>

{#if passage}
  <div class="grid gap-4 ">
    
    <h2 class="bg-brand-700 p-4">
      <a
        href={`${withBasePath(`/passages/${passage.jad_id}`)}`}
        class="text-lg   text-brand-50 transition font-semibold underline underline-offset-4"
      >
        (#{passage.id})
        {passage.work?.[0]?.author
          ? `${passage.work[0].author}: ${passage.work[0].title} (${passage.position_in_work})`
          : passage.work?.[0]?.title || "N/A"}
      </a>
    </h2>

    <div class="text-brand-700 p-4 italic max-h-[500px] overflow-y-auto">
      {passage.text_paragraph || "No text available."}
    </div>   

  </div>
{/if}