import { isExternal } from "util/types";

export function withBasePath(pathname) {
  const base = import.meta.env.BASE_URL;

  // External links (full or protocol-relative): leave untouched
  if (/^(https?:)?\/\//.test(pathname)) return { pathname, isExternal: true };

  // Non-root-relative URLs like anchors, mailto, or `some-page`: leave as-is
  if (!pathname.startsWith("/")) return { pathname, isExternal: false };

  // Internal link: prepend base
  return { pathname: `${base}${pathname}`, isExternal: false };
}
