<script lang="ts">
let {title, definition} : { title: string, definition: string} = $props();
</script>

<div class="flex items-start gap-2">
    <h2 class="text-2xl font-semibold mb-4 text-brand-950">
      {title}
    </h2>
    <span class="group inline-block relative">
        <span aria-hidden="true"
            class="text-brand-950 hover:bg-brand-800 hover:text-brand-50 rounded-full"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" class="lucide lucide-info-icon lucide-info">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
        </span>
        <span class="sr-only">Definition des Begriffes</span>
        <span class="invisible group-hover:visible rounded-md p-3 text-sm md:text-base 
        font-medium bg-brand-900/90 text-brand-50 w-[300px] z-50 absolute left-8 top-0">
            {definition}
        </span>
    </span>
  </div>