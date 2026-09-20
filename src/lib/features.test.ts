import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { load } from "js-yaml";
import { visible, comingSoon, groupByOutcome, cardId, OUTCOMES, type Feature } from "./features";

const f = (id: string, status: Feature["status"], outcome: Feature["outcome"] = "your-mac"): Feature => ({
  id, name: id, outcome, status, headline: "h", summary: "s", detail: "d", requires: [],
});

const FEATURES_DIR = fileURLToPath(new URL("../content/features", import.meta.url));
const inventory = readdirSync(FEATURES_DIR)
  .filter((n) => n.endsWith(".yaml"))
  .map((n) => load(readFileSync(join(FEATURES_DIR, n), "utf8")) as Feature);

describe("features helpers", () => {
  it("visible() returns only shipped, in input order", () => {
    const out = visible([f("a", "shipped"), f("b", "v1_1"), f("c", "planned"), f("d", "shipped")]);
    expect(out.map((x) => x.id)).toEqual(["a", "d"]);
  });
  it("comingSoon() returns only v1_1", () => {
    const out = comingSoon([f("a", "shipped"), f("b", "v1_1"), f("c", "planned")]);
    expect(out.map((x) => x.id)).toEqual(["b"]);
  });
  it("groupByOutcome() keeps OUTCOMES order and drops empty groups", () => {
    const g = groupByOutcome([f("a", "shipped", "automation"), f("b", "shipped", "private")]);
    expect(g.map((x) => x.outcome)).toEqual(["private", "automation"]);
    expect(g[1].features.map((x) => x.id)).toEqual(["a"]);
  });
  it("groupByOutcome() includes only shipped", () => {
    expect(groupByOutcome([f("a", "planned", "notebooks")])).toEqual([]);
    expect(groupByOutcome([f("b", "v1_1", "notebooks")])).toEqual([]);
    const g = groupByOutcome([f("a", "planned", "notebooks"), f("b", "v1_1", "notebooks"), f("c", "shipped", "notebooks")]);
    expect(g.map((x) => x.outcome)).toEqual(["notebooks"]);
    expect(g[0].features.map((x) => x.id)).toEqual(["c"]);
  });
  it("OUTCOMES has the five groups in home-page order", () => {
    expect(OUTCOMES.map((o) => o.id)).toEqual(["private", "your-mac", "memory", "automation", "notebooks"]);
  });
});

describe("inventory ids", () => {
  it("reads every feature file", () => {
    expect(inventory.length).toBeGreaterThan(0);
    for (const feat of inventory) expect(typeof feat.id).toBe("string");
  });

  it("feature ids are unique", () => {
    const ids = inventory.map((feat) => feat.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // /capabilities emits one `id` per outcome group (`id={g.outcome}`) and one per feature
  // card. `memory.yaml` legitimately owns `id: memory`, which is also an outcome id, so
  // cards are namespaced through `cardId()`: that keeps the document's ids unique and keeps
  // `/capabilities#memory` — the link the home page emits — pointing at the group.
  it("no rendered card id collides with an outcome section id", () => {
    const outcomeIds = new Set<string>(OUTCOMES.map((o) => o.id));
    for (const feat of inventory) {
      expect(outcomeIds.has(cardId(feat.id)), `card id for "${feat.id}" collides with an outcome section`).toBe(false);
    }
  });
});
