export function withBasePath(pathname) {
  const base = import.meta.env.BASE_URL;

  // External links (full or protocol-relative): leave untouched
  if (/^(https?:)?\/\//.test(pathname)) return pathname;

  // Non-root-relative URLs like anchors, mailto, or `some-page`: leave as-is
  if (!pathname.startsWith("/")) return pathname;

  // Internal link: prepend base
  return `${base}${pathname}`;
}

// function to check if link is external
export function isExternalLink(pathname) {
  if (!pathname) return false;
  return /^(https?:)?\/\//.test(pathname);
}
