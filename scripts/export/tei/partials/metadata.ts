import type { Passage } from "@/types";

export function listKeywords(keywords: Passage["keywords"]) {
  if (!keywords.length) return "";
  let xml = '<list type="keywords">\n<head>Keywords:</head> ';
  for (let k of keywords)
    for (let subk of k.subkeywords)
      xml += `<item>\n<rs type="keyword" ref="#${subk.jad_id}">${subk.label}</rs>\n</item>\n`;
  return (xml += "</list>");
}

export function listClusters(clusters: Passage["part_of_cluster"]) {
  if (!clusters.length) return "";
  let xml = '<list type="clusters">\n<head>Clusters:</head>\n ';
  for (let c of clusters)
    xml += `<item>\n<rs type="cluster" ref="#${c.jad_id}">${c.value}</rs>\n</item>`;
  return (xml += "</list>");
}

export function listSourceWorks(works: Passage["transmission_graph"]) {
  if (!works.graph.nodes.find((n) => n.nodeType === "ancestor")) return "";
  let xml = '<list type="sourcePassages">\n<head>Source texts:</head> ';
  for (let node of works.graph.nodes.filter((n) => n.nodeType === "ancestor"))
    xml += `<item>\n<rs type="passage" ref="#${node.jad_id}">${node.name}</rs>\n</item>\n`;
  return (xml += "</list>");
}

export function listDerivativeWorks(works: Passage["transmission_graph"]) {
  if (!works.graph.nodes.find((n) => n.nodeType === "descendant")) return "";
  let xml = '<list type="derivativePassages">\n<head>Derivative texts:</head> ';
  for (let node of works.graph.nodes.filter((n) => n.nodeType === "descendant"))
    xml += `<item>\n<rs type="passage" ref="#${node.jad_id}">${node.name}</rs>\n</item>\n`;
  return (xml += "</list>");
}

export function listBiblicalRefs(refs: Passage["biblical_references"]) {
  if (!refs.length) return "";
  let xml = '<list type="biblicalRefs">\n<head>Biblical references:</head> ';
  for (let c of refs)
    xml += `<item>\n<rs type="biblicalRefs" ref="#${c.jad_id}">${c.value}</rs>\n</item>\n`;
  return (xml += "</list>");
}

export function listLiturgicalBiblicalRefs(
  refs: Passage["liturgical_references"],
) {
  if (!refs.length) return "";
  let xml =
    '<list type="liturgicalRefs">\n<head>Liturgical references:</head> ';
  for (let c of refs)
    xml += `<item>\n<rs type="liturgicalRefs" ref="#${c.jad_id}">${c.value}</rs>\n</item>\n`;
  return (xml += "</list>");
}
