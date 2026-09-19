import { describe, it, expect } from "vitest";
import { visible, comingSoon, groupByOutcome, OUTCOMES, type Feature } from "./features";

const f = (id: string, status: Feature["status"], outcome: Feature["outcome"] = "your-mac"): Feature => ({
  id, name: id, outcome, status, headline: "h", summary: "s", detail: "d", screenshot: "x.png", requires: [],
});

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
  it("groupByOutcome() never includes planned", () => {
    const g = groupByOutcome([f("a", "planned", "notebooks")]);
    expect(g).toEqual([]);
  });
  it("OUTCOMES has the five groups in home-page order", () => {
    expect(OUTCOMES.map((o) => o.id)).toEqual(["private", "your-mac", "memory", "automation", "notebooks"]);
  });
});
