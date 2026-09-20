import { z } from "astro/zod";

// The single source of truth for an inventory entry. `content.config.ts` validates
// every `src/content/features/*.yaml` against it at build time, and `features.ts`
// infers the `Feature` type from it, so the two can never drift.
//
// There is deliberately no `screenshot` field: proof images belong to pages, not to
// inventory entries. `Shot.astro` resolves each name through `import.meta.glob` and
// throws at build time when a page names a screenshot that does not exist.
export const featureSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(40),
  outcome: z.enum(["private", "your-mac", "memory", "automation", "notebooks"]),
  status: z.enum(["shipped", "v1_1", "planned"]),
  headline: z.string().min(1).max(80),
  summary: z.string().min(1).max(300),
  detail: z.string().min(1).max(900),
  requires: z.array(z.string()).default([]),
});
