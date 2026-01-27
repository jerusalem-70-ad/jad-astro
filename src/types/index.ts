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
  dateNotBefore: number;
  dateNotAfter: number;
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
    allRelatedPassages: number;
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
  name: string;
  order?: number;
  jad_id?: string;
  value?: string;
  nova_vulgata_url?: string;
  text?: string;
  key?: number;
  description?: string | null;
}

export interface BiblicalReference extends Reference {
  related_passages: ReferencePassage[];
  prev?: Navigation;
  next?: Navigation;
}

interface ReferenceAuthor {
  id?: number;
  name: string;
  jad_id: string;
  alt_name?: string | null;
  place?: Place[];
}

// Author interface
export interface Author {
  id: number;
  name: string;
  jad_id: string;
  gnd_url?: string;
  notes?: string | null;
  lebensdaten?: string | null;
  date_of_birth?: string | null;
  date_of_death?: string | null;
  rawDates?: OrigDate[] | null;
  origDates: string;
  place: Place[];
  alt_name?: string | null;
  works?: any[]; // This appears to be empty in the sample
  prev?: Navigation;
  next?: Navigation;
}

interface OrigDate {
  not_before: string | null;
  not_after: string | null;
  range: string | null;
}

export interface Place {
  id: number;
  value: string;
  geonames_url?: string | null;
  jad_id?: string | null;
  lat?: string | null;
  long?: string | null;
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
  range: string | null;
  not_before: number | null;
  not_after: number | null;
  century?: string[] | null;
}

// Genre interface
export interface Genre {
  id: number;
  value: string;
  color?: string;
}

export interface ReferenceWork {
  id?: number;
  jad_id: string;
  title: string;
  author: ReferenceAuthor[];
  author_certainty: boolean;
}

// Work interface
export interface Work {
  id: number;
  name?: string;
  jad_id: string;
  author: Author[];
  manuscripts: any[]; // This appears to be empty in the sample
  title: string;
  genre: string;
  notes: string | null;
  notes__author: string | null;
  institutional_context: any[]; // This appears to be empty in the sample
  published_edition: any[];
  date_certainty: boolean;
  date: DateItem[];
  link_digital_editions?: string | null;
  author_certainty: boolean;
  incipit?: string | null;
  volume_edition_or_individual_editor?: string | null;
  other_editions?: string | null;
  edition: string;
  related__passages: any[];
  view_label?: string;
  edition_link?: string | null;
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
  jad_id: string;
  title: string;
  author?: string;
  position_in_work?: string;
  passage: string;
}

export interface ReferencePassage {
  id: number;
  jad_id: string;
  passage: string;
  position_in_work: string;
  sort_position?: number;
  page?: string;
  work: ReferenceWork[];
}

// Passage interface
export interface Passage {
  id: number;
  passage: string;
  jad_id: string;
  position_in_work: string | null;
  pages: string | null;
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
  edition_link?: string | null;
  source_passage: SourcePass[];
  mss_occurrences: Mss_occurrences[] | null;
  incipit: string | null;
  view_label?: string;
  prev: Navigation;
  next: Navigation;
  biblical_ref_lvl0: string[];
  biblical_ref_lvl1: string[];
  biblical_ref_lvl2: string[];
  transmission_graph?: TransmissionGraph;
}
export interface Mss_occurrences {
  manuscript: string;
  manuscript_jad_id: string;
  position_in_ms: string;
  main_ms: boolean;
  facsimile_position: string;
  ms_locus: string;
}
