import type { Passage } from "@/types";

export function listKeywords(keywords: Passage["keywords"]) {
  if (!keywords.length) return "";
  let xml = "<p>Keywords: ";
  for (let k of keywords)
    for (let subk of k.subkeywords)
      xml += `<rs type="keyword" ref="#${subk.jad_id}">${subk.label}</rs>\n`;
  return (xml += "</p>");
}

export function listClusters(clusters: Passage["part_of_cluster"]) {
  if (!clusters.length) return "";
  let xml = "<p>Clusters: ";
  for (let c of clusters)
    xml += `<rs type="cluster" ref="#${c.jad_id}">${c.value}</rs>`;
  return (xml += "</p>");
}

export function listSourceWorks(works: Passage["transmission_graph"]) {
  if (!works || !works.graph.nodes.length) return "";
  let xml = "<p>Source texts: ";
  for (let node of works.graph.nodes.filter((n) => n.nodeType === "ancestor"))
    xml += `<rs type="passage" ref="#${node.jad_id}">${node.name}</rs>\n`;
  return (xml += "</p>");
}

export function listDerivativeWorks(works: Passage["transmission_graph"]) {
  if (!works || !works.graph.nodes.length) return "";
  let xml = "<p>Derivative texts: ";
  for (let node of works.graph.nodes.filter((n) => n.nodeType === "descendant"))
    xml += `<rs type="passage" ref="#${node.jad_id}">${node.name}</rs>\n`;
  return (xml += "</p>");
}

export function listBiblicalRefs(refs: Passage["biblical_references"]) {
  if (!refs.length) return "";
  let xml = "<p>Biblical references: ";
  for (let c of refs)
    xml += `<rs type="biblicalRefs" ref="#${c.jad_id}">${c.value}</rs>\n`;
  return (xml += "</p>");
}

export function listLiturgicalBiblicalRefs(
  refs: Passage["liturgical_references"],
) {
  if (!refs.length) return "";
  let xml = "<p>Liturgical references: ";
  for (let c of refs)
    xml += `<rs type="liturgicalRefs" ref="#${c.jad_id}">${c.value}</rs>\n`;
  return (xml += "</p>");
}
