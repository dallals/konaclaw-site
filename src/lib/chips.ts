/* Apple silicon × Qwen3.8-27B sizing model.
 *
 * Imported by BOTH download.astro (to render the table at build time) and its
 * client script (to re-render when the context picker changes). One source of
 * truth on purpose: the previous version hand-wrote the static table and
 * recomputed it in JS, and the two disagreed on 18 of 20 bars and 9 of 20 fit
 * cells the moment you touched the picker.
 *
 * ---- The model ----------------------------------------------------------
 * Qwen3.8-27B (released 2026-08-14) is a hybrid: 64 layers arranged as
 * 16 × (3 × Gated DeltaNet → 1 × Gated Attention). Only the 16 gated-attention
 * layers carry a growing KV cache; the 48 DeltaNet layers hold a fixed-size
 * recurrent state. That is why its cache is ~1/4 that of a conventional
 * 64-layer model and why long context is unusually cheap here.
 *
 *   KV/token = 2 (K+V) × 4 KV heads × 256 head_dim × 2 B × 16 layers = 64 KiB
 *
 * Generation is memory-bandwidth-bound: every token reads the weights plus the
 * whole cache. GEN_EFFICIENCY is the fraction of peak bandwidth MLX actually
 * reaches. Anchored on the one public measurement: a 32 GB M4 Mac mini
 * (120 GB/s) at 4-bit MLX runs 5–6 tok/s, and 120 × 0.8 / 19.25 = 5.0.
 *
 * Prefill is compute-bound. Cost per token is 2 × 27e9 FLOPs of dense work
 * plus attention that grows with position — but only across 16 layers, so the
 * crossover where attention equals everything else sits near 137 K tokens:
 *
 *   4 × n × (24 heads × 256 dim) × 16 layers = 2 × 27e9   →   n ≈ 137,000
 *
 * Prefill is the least certain column: no public measurement exists for this
 * model on Apple silicon, and the M5/M6 neural accelerators make FLOP-based
 * extrapolation shakier still. It is labelled as derived in the UI.
 */

export const MODEL = "Qwen3.8-27B";

/** 4-bit MLX weights, GB. Community Q4_K_M measures 17.1 GB; Ollama ships 18. */
export const WEIGHTS = 17;
/** KV cache per token, GB. 64 KiB — see derivation above. */
export const KV_PER_TOKEN = 65536 / 1024 ** 3;
/** Activations, scratch buffers and the DeltaNet recurrent state, GB. */
export const OVERHEAD = 2;
/** Share of peak memory bandwidth MLX reaches in practice. */
export const GEN_EFFICIENCY = 0.8;
/** Share of peak GPU FLOPs reached during prefill. */
export const PREFILL_MFU = 0.45;
/** Dense FLOPs per prefilled token: 2 × 27e9. */
export const FLOPS_PER_TOKEN = 5.4e10;
/** Context at which attention cost equals the dense cost, in K tokens. */
export const ATTN_CROSSOVER_K = 137;
/** GB held back for macOS and everything else you have open. */
export const RESERVE = 4;
/** Within this much of the ceiling, a config is workable but not comfortable. */
export const TIGHT_BAND = 3;

/** Native context, tokens. Extensible to 1 M with RoPE scaling. */
export const NATIVE_CONTEXT_K = 256;

export interface Chip {
  name: string;
  family: string;
  /** Machines this chip shipped in. */
  where: string;
  cpu: string;
  gpu: string;
  /** Every configurable unified-memory size, GB. */
  mem: number[];
  /** Peak memory bandwidth, GB/s. A pair when configs differ. */
  bw: number | [number, number];
  /** Peak GPU throughput, TFLOPS fp16. Apple publishes none of these; every
   *  figure here is a community estimate, so prefill inherits that softness. */
  tflops: number;
}

/* Bandwidth, core counts and memory options are Apple's published figures. */
export const CHIPS: Chip[] = [
  { name: "M1",       family: "M1 — 2020 · 5 nm",
    where: "Air · mini · 13″ Pro", cpu: "8", gpu: "7–8",
    mem: [8, 16], bw: 68, tflops: 2.6 },
  { name: "M1 Pro",   family: "M1 — 2020 · 5 nm",
    where: "14″/16″ MBP · mini", cpu: "8–10", gpu: "14–16",
    mem: [16, 32], bw: 200, tflops: 5.2 },
  { name: "M1 Max",   family: "M1 — 2020 · 5 nm",
    where: "MBP · Studio", cpu: "10", gpu: "24–32",
    mem: [32, 64], bw: 400, tflops: 10.4 },
  { name: "M1 Ultra", family: "M1 — 2020 · 5 nm",
    where: "Studio", cpu: "20", gpu: "48–64",
    mem: [64, 128], bw: 800, tflops: 21 },

  { name: "M2",       family: "M2 — 2022 · 5 nm (2nd gen)",
    where: "Air · mini · 13″ Pro", cpu: "8", gpu: "8–10",
    mem: [8, 16, 24], bw: 100, tflops: 3.6 },
  { name: "M2 Pro",   family: "M2 — 2022 · 5 nm (2nd gen)",
    where: "14″/16″ MBP · mini", cpu: "10–12", gpu: "16–19",
    mem: [16, 32], bw: 200, tflops: 6.8 },
  { name: "M2 Max",   family: "M2 — 2022 · 5 nm (2nd gen)",
    where: "MBP · Studio", cpu: "12", gpu: "30–38",
    mem: [32, 64, 96], bw: 400, tflops: 13.6 },
  { name: "M2 Ultra", family: "M2 — 2022 · 5 nm (2nd gen)",
    where: "Studio · Mac Pro", cpu: "24", gpu: "60–76",
    mem: [64, 128, 192], bw: 800, tflops: 27.2 },

  { name: "M3",       family: "M3 — 2023 · 3 nm · Dynamic Caching",
    where: "Air · 14″ Pro · iMac", cpu: "8", gpu: "8–10",
    mem: [8, 16, 24], bw: 100, tflops: 4.1 },
  { name: "M3 Pro",   family: "M3 — 2023 · 3 nm · Dynamic Caching",
    where: "14″/16″ MBP", cpu: "11–12", gpu: "14–18",
    mem: [18, 36], bw: 150, tflops: 7.4 },
  { name: "M3 Max",   family: "M3 — 2023 · 3 nm · Dynamic Caching",
    where: "MBP", cpu: "14–16", gpu: "30–40",
    mem: [36, 48, 64, 96, 128], bw: [300, 400], tflops: 16.4 },
  { name: "M3 Ultra", family: "M3 — 2023 · 3 nm · Dynamic Caching",
    where: "Studio", cpu: "28–32", gpu: "60–80",
    mem: [96, 192, 256, 512], bw: 800, tflops: 32.8 },

  { name: "M4",       family: "M4 — 2024 · 3 nm (2nd gen) · ray tracing",
    where: "Air · mini · iMac · MBP", cpu: "10", gpu: "10",
    mem: [16, 24, 32], bw: 120, tflops: 4.6 },
  { name: "M4 Pro",   family: "M4 — 2024 · 3 nm (2nd gen) · ray tracing",
    where: "MBP · mini", cpu: "12–14", gpu: "16–20",
    mem: [24, 48, 64], bw: 273, tflops: 9.2 },
  { name: "M4 Max",   family: "M4 — 2024 · 3 nm (2nd gen) · ray tracing",
    where: "MBP · Studio", cpu: "14–16", gpu: "32–40",
    mem: [36, 48, 64, 128], bw: [410, 546], tflops: 18.4 },

  { name: "M5",       family: "M5 — 2025 · 3 nm (3rd gen) · neural accelerators",
    where: "14″ MBP · iPad Pro", cpu: "10", gpu: "10",
    mem: [16, 24, 32], bw: 153, tflops: 9 },
  { name: "M5 Pro",   family: "M5 — 2025 · 3 nm (3rd gen) · neural accelerators",
    where: "MBP · mini", cpu: "18", gpu: "20–40",
    mem: [24, 36, 48, 64, 128], bw: 307, tflops: 18 },
  { name: "M5 Max",   family: "M5 — 2025 · 3 nm (3rd gen) · neural accelerators",
    where: "MBP · Studio", cpu: "18", gpu: "32–40",
    mem: [36, 48, 64, 128], bw: [460, 614], tflops: 28 },
  { name: "M5 Ultra", family: "M5 — 2025 · 3 nm (3rd gen) · neural accelerators",
    where: "Studio", cpu: "up to 36", gpu: "up to 80",
    mem: [96, 192, 256, 512], bw: 1200, tflops: 56 },

  { name: "M6",       family: "M6 — 2026 · 2 nm",
    where: "mini", cpu: "12", gpu: "12",
    mem: [16, 32], bw: 170, tflops: 11 },
];

export const CONTEXTS = [4, 8, 32, 128, 256, 1024];

const hi = (bw: number | [number, number]) => (Array.isArray(bw) ? bw[1] : bw);
const lo = (bw: number | [number, number]) => (Array.isArray(bw) ? bw[0] : bw);

/** KV cache for a context window, GB. */
export const kvGB = (ctxK: number) => KV_PER_TOKEN * ctxK * 1024;

/** Total unified memory the model needs at this context, GB. */
export const needGB = (ctxK: number) => WEIGHTS + kvGB(ctxK) + OVERHEAD;

/** Generation throughput, tok/s. Bandwidth-bound. */
export const genTokS = (bw: number, ctxK: number) =>
  (bw * GEN_EFFICIENCY) / (WEIGHTS + kvGB(ctxK));

/** Prefill throughput, tok/s. Compute-bound, decaying with context. */
export const prefillTokS = (tflops: number, ctxK: number) =>
  ((tflops * 1e12 * PREFILL_MFU) / FLOPS_PER_TOKEN) /
  (1 + ctxK / ATTN_CROSSOVER_K);

/** Both ends of a chip's generation range. */
export const genRange = (c: Chip, ctxK: number): [number, number] =>
  [genTokS(lo(c.bw), ctxK), genTokS(hi(c.bw), ctxK)];

/** Both ends of a chip's prefill range. */
export const prefillRange = (c: Chip, ctxK: number): [number, number] => {
  const t = prefillTokS(c.tflops, ctxK);
  return [t, t];
};

export type FitLevel = "yes" | "tight" | "no";
export interface Fit { level: FitLevel; label: string; }

/**
 * Smallest memory config that holds the model at this context, reserving
 * RESERVE GB for macOS. "Fits via swap" is deliberately not a category:
 * paging 17 GB of weights per token is not a configuration anyone can use.
 */
export function fitFor(c: Chip, ctxK: number): Fit {
  const need = needGB(ctxK);
  const ok = c.mem.filter((m) => m - RESERVE >= need);
  if (!ok.length) return { level: "no", label: `No · needs ${fmt(need + RESERVE)} GB` };
  const min = ok[0];
  const level: FitLevel = min - RESERVE - need < TIGHT_BAND ? "tight" : "yes";
  return { level, label: min === c.mem[0] && level === "yes" ? "Yes" : `${min} GB+` };
}

export const fmt = (n: number): string =>
  n >= 100 ? String(Math.round(n))
  : n >= 10 ? String(Math.round(n))
  : n >= 1 ? (Math.round(n * 10) / 10).toFixed(1)
  : (Math.round(n * 100) / 100).toFixed(2);

export const range = ([a, b]: [number, number]): string =>
  fmt(a) === fmt(b) ? `~${fmt(a)}` : `~${fmt(a)}–${fmt(b)}`;

export const ctxLabel = (k: number) => (k >= 1024 ? "1 M" : `${k} K`);

export const memLabel = (mem: number[]) =>
  mem.length === 1 ? `${mem[0]} GB` : `${mem[0]}–${mem[mem.length - 1]} GB`;

export const bwLabel = (bw: number | [number, number]) =>
  Array.isArray(bw) ? `${bw[0]}–${bw[1]} GB/s` : `${bw} GB/s`;

/** Widest generation figure across all chips, for scaling the bars. */
export const maxGen = (ctxK: number) =>
  Math.max(...CHIPS.map((c) => genRange(c, ctxK)[1]));
