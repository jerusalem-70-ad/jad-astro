<script>
  let { mode = 'card', children } = $props();
</script>

<div class="graph-container bg-white border rounded-md shadow-sm {mode === 'featured' ? 'p-4' : 'p-1'}">
  {@render children?.()}
</div>