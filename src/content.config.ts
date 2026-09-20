import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { featureSchema } from "./lib/featureSchema";

const features = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/features" }),
  schema: featureSchema,
});

export const collections = { features };
