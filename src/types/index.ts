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
  x: number;
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
  nova_vulgata_url?: string;
  text?: string;
  key?: number;
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

export interface SourcePass {
  id: number;
  jad_id: number;
  title: string;
  author?: string;
  position_in_work?: string;
  passage: string;
}

// Passage interface
export interface Passage {
  id: number;
  passage: string;
  jad_id: string;
  position_in_work: string | null;
  text_paragraph: string | null;
  note: string | null;
  explicit_contemp_ref: string | null;
  biblical_references: Reference[];
  work: Work[];
  keywords: any[]; // This appears to be empty in the sample
  part_of_cluster: any[]; // This appears to be empty in the sample
  authority_discourse?: number;
  liturgical_references: any[]; // This appears to be empty in the sample
  occurrence_found_in: ValueItem[];
  source_passage: SourcePass[];
  mss_occurrences: Mss_occurrences[] | null;
  incipit: string | null;
  ai_bibl_ref: any[];
  view_label?: string;
  prev: Navigation;
  next: Navigation;
  biblical_ref_lvl0: string[];
  biblical_ref_lvl1: string[];
  biblical_ref_lvl2: string[];
  transmission_graph: TransmissionGraph;
}
export interface Mss_occurrences {
  manuscript: string;
  manuscript_jad_id: string;
  position_in_ms: string;
  main_ms: boolean;
  facsimile_position: string;
  ms_locus: string;
}
