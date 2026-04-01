<script lang="ts">
  export let padded: boolean = true;
</script>

<div class="bg-brand-100/20 border rounded-md shadow-sm">
  <div class={padded ? "p-4" : ""}>
    <slot />
  </div>
</div>