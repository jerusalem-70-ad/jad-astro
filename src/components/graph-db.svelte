<script>
import passageList from '@/content/data/passage_list.json';
import { withBasePath } from '@/lib/withBasePath.js';
import {exportTableToCSV} from '@/lib/download-table.js';
import { selectedJadId } from "@/lib/stores/jad_store.js";

  let jadId = '';
  let amount = 4;
  let collection = 'JAD sentences';
  let maxDistance = 0.1;

  let results = null;
  let loading = false;
  let error = null;

  async function fetchSimilarity() {
    loading = true;
    error = null;
    results = null;

    const params = new URLSearchParams({
      amount: amount.toString(),
      collection,
      'jad-id': `jad_occurrence__${jadId}`,
      'max-distance': maxDistance.toString()
    });

    console.log('Fetching similarity with params:', { jadId, amount, collection, maxDistance });
    try {
      const response = await fetch(
        `https://jad-graph-db.acdh-dev.oeaw.ac.at/jad/q?${params}`
      );
      if (!response.ok) {
        throw new Error('API request failed');
      }

      results = await response.json();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }

  }
  $: if ($selectedJadId) {
    jadId = $selectedJadId.split('__')[1] //update the jadID with that from the store
 fetchSimilarity();
}
</script>
<div class="grid h-full content-center gap-6">
  <div class="bg-white border border-neutral-200 rounded-lg p-6">
    <form
      on:submit|preventDefault={fetchSimilarity}
      class="flex gap-4 items-end flex-wrap"
    >
  
      <div class="grid gap-1">
        <label for="jadId" class="text-xs font-medium text-brand-700 uppercase tracking-wide">
          Passage ID
        </label>
        <input
          type="text"
          name="passage-id"
          bind:value={jadId}
          placeholder="e.g. 1234"
          class="w-32 h-10 border border-neutral-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
        />
      </div>
  
      <div class="grid gap-1">
        <label for="amount" class="text-xs font-medium text-brand-700 uppercase tracking-wide">
          Number of similarities
        </label>
        <input
          type="number"
          name="number-of-similarities"
          bind:value={amount}
          class="w-40 h-10 border border-neutral-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
  
      <div class="grid gap-1">
        <label  for="collection"
        class="text-xs font-medium text-brand-700 uppercase tracking-wide">
          Collection
        </label>
        <select
          bind:value={collection}
          name="collection"
          class="h-10 border border-neutral-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="JAD sentences">JAD sentences</option>
          <option value="Vulgata">Vulgata</option>
        </select>
      </div>
  
      <div class="grid gap-1">
        <label for="maxDistance" class="text-xs font-medium text-brand-700 uppercase tracking-wide">
          Max Distance
        </label>
        <input
          type="number"
          bind:value={maxDistance}
          name="max-distance"
          step="0.01"
          max="0.5"
          class="w-32 h-10 border border-neutral-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
  
      <button
        type="submit"
        class="h-10 px-6 bg-brand-650 text-brand-50 rounded-md text-base font-semibold hover:bg-brand-400 transition-colors shadow-sm"
      >
        Find Similar Passages
      </button>
  
    </form>
  </div>
 
  {#if loading}
    <div class="flex items-center justify-center gap-2 ">
      <span class="text-brand-650">Loading ... </span>
      <span class="loader"></span>
    </div>
  {/if}
  
  {#if error}
    <p style="color:red">{error}</p>
  {/if}
  
  {#if results}
  
  <div class="w-full bg-white border border-neutral-200 rounded-lg p-6 mt-6 grid gap-4">
    <h2 class="text-xl font-bold mb-2 text-brand-800">(#{results['jad-id'].split('__')[1]})
      {passageList[results['jad-id']]?.full_title || results['jad-id']}
      <a href={withBasePath(`/passage/${results['jad-id']}`)} class="text-sm text-brand-650 hover:text-brand-400 underline underline-offset-4 decoration-dotted ml-2">View passage</a></h2>
    <details>
      <summary class="cursor-pointer text-brand-700 mb-4">
         {#if passageList[results.similar_passages[0]]}
                Similar Passages
               {:else}
                Biblical quotations
              {/if} : {results.similar_passages.length} [Distance {maxDistance} and lower]
        </summary>
      <ul class="list-decimal list-inside space-y-1">
        {#each results.similar_passages as simPassage}
          <li>
            {passageList[simPassage]?.full_title || simPassage}
            {#if passageList[simPassage]}
              <a href={withBasePath(`/passage/${simPassage}`)}
              class="text-sm text-brand-650 hover:text-brand-400 underline underline-offset-4 decoration-dotted ml-2">View passage</a>
            {/if}
          </li>
        {/each}
      </ul>
    </details>
    <button 
        class="h-10 px-4 bg-brand-650 text-brand-50 rounded-md text-base font-semibold
         hover:bg-brand-400 transition-colors shadow-sm justify-self-end"
      on:click={() => exportTableToCSV(`similarities-${results['jad-id']}.csv`)}>CSV</button>
    <div class="border border-neutral-200 rounded-md overflow-hidden shadow-sm">
    <table class="table-fixed w-full">
    <caption class="text-left text-sm text-neutral-600 p-3 caption-bottom">
      Text similariteis per sentence for passage #{results['jad-id'].split('__')[1]}
      {passageList[results['jad-id']]?.full_title || results['jad-id']}
      [Distance {maxDistance} and lower]
    </caption>
      <thead class="bg-brand-650 text-brand-50">
        <tr>
          <th class="p-3 w-2/12 font-semibold text-left">Sentence</th>
          <th class="p-3 w-5/12 font-semibold text-left">Text</th>
          <th class="p-3 w-5/12 font-semibold text-left">Similar sentences</th>
        </tr>
      </thead>
  
    <tbody class="divide-y divide-neutral-200">
    {#each results.similar as sentence}
      <tr>
        <td class="p-3">{sentence.id.split('-')[1]}</td>
        <td class="p-3 italic wrap-break-words whitespace-normal">{sentence.text}</td>
        <td class="p-3 wrap-break-words whitespace-normal align-top">
          <ul class="list-none space-y-3">
          {#if sentence.similar.length === 0}
            <li class="text-sm text-neutral-500">No similar sentences found.</li>
          {/if}
          {#each sentence.similar as sim}
            <li class="bg-neutral-50 rounded-md p-3 border border-neutral-200 shadow-sm">
              
              {#if passageList[sim.id.split('-')[0]]}
                <strong> (# {sim.id.split('-')[1]}) {passageList[sim.id.split('-')[0]]?.full_title || sim.id}</strong>
                <a href={withBasePath(`/passage/${sim.id}`)} class="text-sm text-brand-650
               hover:text-brand-400 underline underline-offset-4 decoration-dotted">View passage</a>
               {:else}
                <strong>{sim.id}</strong>
              {/if} 
              <p class="text-base text-brand-800 italic">{sim.text} <span class="not-italic">[Distance: {sim.distance.toFixed(2)}]</span></p>
              </li>
            {/each}
          </ul>
        </td>
      </tr>
      {/each}
    </tbody>
  </table>
  </div>
  </div>
  {/if}
</div>