<script lang="ts">
import { onMount } from "svelte";
import { withBasePath } from "@/lib/withBasePath.js";
import { selectedJadId } from "@/stores/jad_store";

import {dataPassagesGraph} from "@/stores/jad_store";

const data = $dataPassagesGraph.nodes

let passage: any = null;
let loading = false;
let error: string | null = null;
let statusMessage = "";

$: if ($selectedJadId) {
  loading = true;

  const found = $dataPassagesGraph?.nodes?.find(
    node => node.jad_id === $selectedJadId
  );

  if (found) {
    passage = found;
    statusMessage = `Passage ${found.id} loaded.`;
    error = null;
  } else {
    passage = null;
    error = "Passage not found.";
  }
  loading = false;
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
        {passage.passage || "No text available."}
      </a>
        
    </h2>
     <dl class="grid grid-cols-[1fr_6fr] text-sm md:leading-7 px-4">
      <dt class="font-semibold text-brand-900 border-r border-neutral-300 pr-5">Author:</dt>
      <dd class="pl-5">{passage.author || "N/A"}</dd>
      <dt class="font-semibold text-brand-900 border-r border-neutral-300 pr-5">Work:</dt>
      <dd class="pl-5">{passage.work || "N/A"}</dd>
      <dt class="font-semibold text-brand-900 border-r border-neutral-300 pr-5">Date:</dt>
      <dd class="pl-5">{passage.dateNotBefore}</dd>
    </dl>     

  </div>
{/if}