import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const shotExists = (name: string) => existsSync(resolve("public/shots", name));

export const featureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(40),
  outcome: z.enum(["private", "your-mac", "memory", "automation", "notebooks"]),
  status: z.enum(["shipped", "v1_1", "planned"]),
  headline: z.string().min(1).max(80),
  summary: z.string().min(1).max(300),
  detail: z.string().min(1).max(900),
  screenshot: z.string().regex(/^[a-z0-9-]+\.png$/).refine(shotExists, {
    error: (iss) => `screenshot "${iss.input}" not found under public/shots/ — run \`make shots\` or \`make shots-placeholder\``,
  }),
  requires: z.array(z.string()).default([]),
});

const features = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/features" }),
  schema: featureSchema,
});

export const collections = { features };
