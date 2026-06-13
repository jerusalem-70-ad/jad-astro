// get all related nodes; loop upstream and downstream to collect all related nodes (incl. indirect ones like grapndchildren, ur-ur-grandparents)
// function is to be called e.g. by hover over a node, so that all related nodes get also selected/highlighted
import type { PreparedGraph } from "@/lib/graph/prepareGraph";
export function getLineageSet(
  startId: string,
  ancestorsMap: PreparedGraph["ancestorsMap"],
  descendantsMap: PreparedGraph["descendantsMap"],
): Set<string> {
  const result = new Set<string>([startId]);

  // upstream
  const stackUp = [startId];
  while (stackUp.length) {
    const current = stackUp.pop()!;
    const parents = ancestorsMap.get(current) ?? new Set<string>();

    parents.forEach((p) => {
      if (!result.has(p)) {
        result.add(p);
        stackUp.push(p);
      }
    });
  }

  // downstream
  const stackDown = [startId];
  while (stackDown.length) {
    const current = stackDown.pop()!;
    const children = descendantsMap.get(current) ?? new Set<string>();

    children.forEach((c) => {
      if (!result.has(c)) {
        result.add(c);
        stackDown.push(c);
      }
    });
  }

  return result;
}
