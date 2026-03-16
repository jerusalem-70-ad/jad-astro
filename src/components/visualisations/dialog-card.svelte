<script lang="ts">
import { selectedJadId } from "@/stores/jad_store";
import PassageCard from "@/components/passage-card.svelte";
import { onMount } from "svelte";

let dialog: HTMLDialogElement;

$: if ($selectedJadId && dialog && !dialog.open) {
  dialog.showModal();
}
</script>

<dialog id="passage-dialog" bind:this={dialog} class="w-1/4 border-2 border-brand-800 
grid space-y-2 rounded-md pb-3 bg-brand-100">
    <PassageCard/>
   <button commandfor="passage-dialog" command="close" 
   class="block mx-auto text-lg bg-brand-50 px-3 py-1.5 border border-neutral-300 
   rounded-md font-bold text-brand-800 cursor-pointer hover:text-brand-500">Close</button>
</dialog>