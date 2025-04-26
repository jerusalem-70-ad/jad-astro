// src/types/index.ts

// Node types for the transmission graph
export type NodeType = "current" | "ancestor" | "descendant" | "regular";

// Basic node information
export interface GraphNode {
  id: string | number;
  name: string;
  work: string;
  author: string;
  passage: string;
  jad_id: string;
  depth: number;
  nodeType: NodeType;
}

// Link between nodes
export interface GraphLink {
  source: string | number;
  target: string | number;
  depth: number;
  type?: string;
}

// Complete graph structure
export interface TransmissionGraph {
  id: string | number;
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  metadata: {
    ancestorCount: number;
    descendantCount: number;
  };
}

// Language interface
export interface Language {
  id: number;
  value: string;
  color: string;
}

// Reference interfaces
export interface Reference {
  id: number;
  value: string;
}

// Author interface
export interface Author {
  id: number;
  name: string;
  jad_id: string;
  gnd_url?: string;
  notes?: string | null;
  lebensdaten?: string | null;
}

// Published Edition interface
export interface PublishedEdition {
  id: number;
  name: string;
  jad_id: string;
  digi_url?: string;
}

// Date interface
export interface DateItem {
  id: number;
  value: string;
}

// Genre interface
export interface Genre {
  id: number;
  value: string;
  color: string;
}

// Work interface
export interface Work {
  id: number;
  name: string;
  jad_id: string;
  author: Author[];
  manuscripts: any[]; // This appears to be empty in the sample
  title: string;
  genre: Genre;
  notes: string | null;
  notes__author: string | null;
  institutional_context: any[]; // This appears to be empty in the sample
  published_edition: PublishedEdition[];
  date_certainty: boolean;
  date: DateItem[];
  link_digital_editions: string;
  author_certainty: boolean;
  incipit: string | null;
  volume_edition_or_individual_editor: string | null;
}

// Value-only interface (used for multiple fields)
export interface ValueItem {
  id: number;
  value: string;
}

// Navigation interface
export interface Navigation {
  id: string;
  label: string;
}

// Passage interface
export interface Passage {
  id: number;
  passage: string;
  jad_id: string;
  language: Language;
  position_in_work: string;
  text_paragraph: string;
  note: string | null;
  explicit_contemp_ref: string | null;
  biblical_references: Reference[];
  work: Work[];
  sources_used: ValueItem[];
  keywords: any[]; // This appears to be empty in the sample
  part_of_cluster: any[]; // This appears to be empty in the sample
  authority_discourse: number;
  liturgical_references: any[]; // This appears to be empty in the sample
  occurrence_found_in: ValueItem[];
  author_lookup: {
    ids: {
      [key: string]: number;
    };
    value: string;
  }[];
  source_passage: ValueItem[];
  mss_locus: any[]; // This appears to be empty in the sample
  occurrence_ms: any[]; // This appears to be empty in the sample
  main_ms: any[]; // This appears to be empty in the sample
  incipit: string | null;
  manuscripts: any[]; // This appears to be empty in the sample
  ai_bibl_ref: [
    {
      bibl: string;
      text: string;
    }
  ];
  view_label: string;
  prev: Navigation;
  next: Navigation;
  biblical_ref_lvl0: string[];
  biblical_ref_lvl1: string[];
  biblical_ref_lvl2: string[];
  transmission_graph: TransmissionGraph;
}
