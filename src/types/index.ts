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
  name?: string;
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
  jad_id: string;
  name: string;
  alt_name?: string | null;
  place: Place[];
}

export interface AuthorFull extends Author {
  gnd_url?: string;
  notes?: string | null;
  lebensdaten?: string | null;
  date_of_birth?: string | null;
  date_of_death?: string | null;
  rawDates?: OrigDate[] | null;
  origDates: string;
  id: number;
  works: Work[];
  alt_name?: string | null;
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
  jad_id: string;
  title: string;
  author: Author[];
  author_certainty: boolean;
  date: DateItem[];
  genre: string | null;
  link_digital_editions?: string | null;
  incipit?: string | null;
  edition: string;
}

export interface WorkFull extends Work {
  date_certainty: boolean;
  manuscripts?: any[];
  name?: string;
  other_editions?: string | null;
  related__passages: RelPassage[];
  edition_link?: string | null;
  view_label?: string;
  volume_edition_or_individual_editor?: string | null;
  published_edition: any[];
  notes?: string | null;
  notes__author: string | null;
  institutional_context: any[];
  prev?: Navigation;
  next?: Navigation;
}

interface RelPassage {
  position_in_work: string;
  sort_position?: number;
  passages: PassageRef[];
}

interface PassageRef {
  id: number;
  jad_id: string;
  passage: string;
  page?: string;
  occurrence_found_in: string[];
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
  jad_id: string;
  passage: string;
  work: Work[];
  position_in_work: string | null;
  pages: string | null;
  note: string | null;
  explicit_contemp_ref: string | null;
  biblical_references: Reference[];
  keywords: Ref[] | null;
  part_of_cluster: Ref[] | null;
  authority_discourse?: number;
  liturgical_references: Ref[]; // This appears to be empty in the sample
  occurrence_found_in: ValueItem[];
  edition_link?: string | null;
  source_passage: SourcePass[];
  text_paragraph: string | null;
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
  lib_place: Place[];
  position_in_ms: string;
  main_ms: boolean;
  facsimile_position: string;
  ms_locus: string;
}

export interface Ref {
  id: number;
  value: string;
  order: string;
}
