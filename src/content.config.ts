import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

const authors = defineCollection({
  loader: file("./src/content/data/authors.json"),
  schema: z.object({}),
});

const biblical_references = defineCollection({
  loader: file("./src/content/data/biblical_references.json"),
  schema: z.object({}),
});

const clusters = defineCollection({
  loader: file("./src/content/data/clusters.json"),
  schema: z.object({}),
});

const dates = defineCollection({
  loader: file("./src/content/data/dates.json"),
  schema: z.object({}),
});

const institutional_contexts = defineCollection({
  loader: file("./src/content/data/institutional_contexts.json"),
  schema: z.object({}),
});

const keywords = defineCollection({
  loader: file("./src/content/data/keywords.json"),
  schema: z.object({}),
});
const libraries = defineCollection({
  loader: file("./src/content/data/libraries.json"),
  schema: z.object({}),
});
const liturgical_references = defineCollection({
  loader: file("./src/content/data/liturgical_references.json"),
  schema: z.object({}),
});
const manuscripts = defineCollection({
  loader: file("./src/content/data/manuscripts.json"),
  schema: z.object({}),
});
const ms_occurrences = defineCollection({
  loader: file("./src/content/data/ms_occurrences.json"),
  schema: z.object({}),
});
const passages = defineCollection({
  loader: file("./src/content/data/passages.json"),
  schema: z.object({}),
});
const sources_occurrences = defineCollection({
  loader: file("./src/content/data/sources_occurrences.json"),
  schema: z.object({}),
});
const works = defineCollection({
  loader: file("./src/content/data/works.json"),
  schema: z.object({}),
});

// 4. Export a single `collections` object to register your collection(s)
export const collections = {
  authors,
  works,
  sources_occurrences,
  passages,
  biblical_references,
  liturgical_references,
  clusters,
  keywords,
  dates,
  institutional_contexts,
  libraries,
  manuscripts,
  ms_occurrences,
};
