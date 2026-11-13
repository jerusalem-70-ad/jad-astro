<script lang="ts">
  import { selectedViz } from "@/stores/jad_store.ts";
  import CurrentFilters from "@/components/search/current-filters.svelte";
  import Graph from "@/components/visualisations/ChronologicalGraph.svelte";
  import GenreWorkPieChart from "@/components/visualisations/genre-work-piechart.svelte";
  import BiblBookGraph from "@/components/visualisations/bible-books.svelte";
  import LiturgicalGraph from "@/components/visualisations/liturgical-ref.svelte";
  import KeywordsPieChart from "@/components/visualisations/keywords-piechart.svelte";
  import TabulatorDashboard from "@/components/tabulator-dashboard.svelte"

  // The order here is the order of the cards
  const VIZ = [
    { id: "timeline", title: "Timeline", component: Graph },
    { id: "table", title: "Passages", component: TabulatorDashboard },
    { id: "genres", title: "Genres", component: GenreWorkPieChart },
    { id: "bible", title: "Biblical books", component: BiblBookGraph },
    { id: "liturgy", title: "Liturgical references", component: LiturgicalGraph },
    { id: "keywords", title: "Keywords", component: KeywordsPieChart },
  ];

  let featured = $derived(VIZ.find((v) => v.id === $selectedViz) ?? VIZ[0]);
  let cards = $derived(VIZ.filter((v) => v.id !== featured.id));
</script>

<div class="grid grid-cols-[minmax(0,1fr)_14rem] items-start gap-3">
  <div class="space-y-2 py-3">
    <CurrentFilters />
    {#key featured.id}
      <featured.component mode="featured" />
    {/key}
  </div>

  <div class="sticky top-25 space-y-2 pr-3 py-3">
    {#each cards as card (card.id)}
      <button
        type="button"
        onclick={() => selectedViz.set(card.id)}
        aria-label="Show {card.title} in the center"
        class="block w-full cursor-pointer rounded-md border bg-white text-left hover:border-brand-500"
      >
        <card.component mode="card" />
      </button>
    {/each}
  </div>
</div>