import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import { type PRNG, range } from './prng';

extend([mixPlugin]);

export type Harmony =
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'tetradic'
  | 'square'
  | 'monochrome';

export interface Palette {
  bg: string;
  c1: string;
  c2: string;
  c3: string;
  ink: string;
  swatches: string[]; // [bg, c1, c2, c3, ink]
}

const HARMONY_OFFSETS: Record<Harmony, [number, number, number, number]> = {
  analogous: [0, 25, -25, 50],
  complementary: [0, 180, 20, 160],
  'split-complementary': [0, 150, 210, 30],
  triadic: [0, 120, 240, 60],
  tetradic: [0, 60, 180, 240],
  square: [0, 90, 180, 270],
  monochrome: [0, 0, 0, 0],
};

export function generatePalette(rng: PRNG, harmony: Harmony): Palette {
  const baseHue = range(rng, 0, 360);
  const baseSat = range(rng, 64, 90) / 100;
  const offsets = HARMONY_OFFSETS[harmony];
  const mono = harmony === 'monochrome';

  // base swatch in HSL; colord refines lightness/saturation per role
  const base = (hueOffset: number, sat: number, light: number) =>
    colord({ h: (baseHue + hueOffset) % 360, s: sat * 100, l: light * 100 });

  const bg = base(offsets[0], mono ? 0.32 : 0.26, 0.96).toHex();
  const c1 = base(offsets[1], baseSat, mono ? 0.44 : 0.53).toHex();
  const c2 = base(offsets[2], baseSat - 0.08, mono ? 0.6 : 0.63).toHex();
  const c3 = base(offsets[3], baseSat - 0.16, mono ? 0.78 : 0.73).toHex();
  // ink tinted toward base hue, mixed with near-black for richness
  const ink = base(offsets[0], mono ? 0.34 : 0.3, 0.15).mix('#0b0b12', 0.4).toHex();

  return { bg, c1, c2, c3, ink, swatches: [bg, c1, c2, c3, ink] };
}
