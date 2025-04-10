// src/types/index.ts

// Node types for the transmission graph
export type NodeType = "current" | "ancestor" | "descendant" | "regular";

// Basic node information
export interface GraphNode {
  id: string | number;
  jad_id: string;
  name: string;
  work: string;
  author: string;
  passage: string;
  depth: number;
  nodeType: NodeType;
  children: GraphNode[];
}

// Link between nodes
export interface GraphLink {
  source: string | number;
  target: string | number;
  depth: number;
}

// Complete graph structure
export interface TransmissionGraph {
  id: string | number;
  tree: GraphNode;
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  metadata: {
    ancestorCount: number;
    descendantCount: number;
  };
}

// Passage interface
export interface Passage {
  id: number | string;
  jad_id: string;
  passage: string;
  text_paragraph: string;
  position_in_work: string;
  work: Work[];
  manuscripts: Manuscript[];
  biblical_references: Reference[];
  liturgical_references: Reference[];
  ai_bibl_ref: Reference[];
  source_passage: SourcePassage[];
  keywords: Keyword[];
  part_of_cluster: Cluster[];
  occurrence_found_in: Occurrence[];
  note?: string;
  transmission_graph?: TransmissionGraph;
  prev: { id: string };
  next: { id: string };
  biblical_ref_lvl0?: string[];
  biblical_ref_lvl1?: string[];
  biblical_ref_lvl2?: string[];
}

// Other related interfaces
export interface Work {
  id: number | string;
  jad_id: string;
  name: string;
  title: string;
  author: Author[];
  author_certainty: boolean;
  date: DateItem[];
  institutional_context?: Institution[];
}

export interface Author {
  id: number | string;
  jad_id: string;
  name: string;
}

export interface DateItem {
  id: number | string;
  value: string;
}

export interface Manuscript {
  id: number | string;
  jad_id: string;
  value: string;
  view_label?: string;
}

export interface Reference {
  id: number | string;
  value: string;
  name?: string;
  text?: string;
  nova_vulgata_url?: string;
}

export interface SourcePassage {
  id: number | string;
  jad_id?: string;
}

export interface Keyword {
  id: number | string;
  jad_id: string;
  name: string;
}

export interface Cluster {
  id: number | string;
  value: string;
}

export interface Institution {
  id: number | string;
  jad_id: string;
  name: string;
}

export interface Occurrence {
  value: string;
}
