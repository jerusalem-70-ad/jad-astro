<script lang="ts">
import { onMount } from "svelte";
import { selectedJadId } from "@/stores/jad_store";
import PassageCard from "@/components/passage-card.svelte";
import { withBasePath } from "@/lib/withBasePath.js";

let dialog: HTMLDialogElement;
 

$: if ($selectedJadId && dialog && !dialog.open) {
  dialog.showModal();
}

$: if (!$selectedJadId && dialog?.open) {
  dialog.close();
}


onMount(() => {
  // handle initial value (important for Chrome)
  if ($selectedJadId && dialog && !dialog.open) {
    dialog.showModal();
  }
});
$: console.log("store value:", $selectedJadId);
</script>
    <dialog id="passage-dialog" bind:this={dialog} class="w-1/4  rounded-lg bg-brand-50 shadow-2xl 
    grid space-y-2 pb-3 ">
        <PassageCard/>
        <div class="flex justify-between">
           <a
          href={withBasePath(`/passages/${$selectedJadId}`)}
         class="block mx-auto text-sm  px-3 py-1.5 border border-neutral-300 
              rounded-md font-bold  cursor-pointer text-brand-50 bg-brand-600 hover:bg-brand-500 transition">
       See details
      </a>
          <button onclick={() => selectedJadId.set(null)}
              class="block mx-auto text-sm  px-3 py-1.5 border border-neutral-300 
              rounded-md font-bold cursor-pointer text-brand-50 bg-brand-600 hover:bg-brand-500 transition">Close</button>
        </div>
    </dialog>