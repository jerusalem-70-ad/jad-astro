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

const keywords = defineCollection({
  loader: file("./src/content/data/keywords.json"),
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

const passages = defineCollection({
  loader: file("./src/content/data/passages.json"),
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
  passages,
  biblical_references,
  liturgical_references,
  clusters,
  keywords,
  manuscripts,
};
