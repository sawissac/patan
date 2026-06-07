// mulberry32 — deterministic PRNG seeded by a 32-bit integer
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function next(): number {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PRNG = ReturnType<typeof createPRNG>;

/** Pick a random integer in [0, n) */
export function pick(rng: PRNG, n: number): number {
  return Math.floor(rng() * n);
}

/** Pick a random float in [min, max) */
export function range(rng: PRNG, min: number, max: number): number {
  return min + rng() * (max - min);
}
