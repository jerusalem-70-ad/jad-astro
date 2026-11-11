<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { withBasePath, isExternalLink } from '@/lib/withBasePath.js';

  interface Props extends HTMLAnchorAttributes {
    reload?: boolean;
  }

  let { href, reload = false, ...rest }: Props = $props();

  let pathname = $derived(href ? withBasePath(href) : undefined);
  let isExternal = $derived(href ? isExternalLink(href) : false);
</script>

<a
  {...rest}
  href={pathname}
  target={isExternal ? '_blank' : undefined}
  rel={isExternal ? 'noopener noreferrer' : undefined}
  class="text-brand-900 underline underline-offset-2 hover:text-brand-600"
>
  {@render rest.children?.()}
</a>