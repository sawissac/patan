import type { Palette, Harmony } from '../lib/palette';

export type Mode = 'avatar';
export type { Harmony, Palette };

/** The five base avatar slots a custom asset can be imported into. */
export type SlotName = 'Background' | 'Face' | 'Eyes' | 'Mouth' | 'Accessory';

/** Palette role an imported asset can be recolored to (null = keep original colors). */
export type RecolorRole = 'bg' | 'c1' | 'c2' | 'c3' | 'ink';

/** A user-imported SVG asset, appended as an extra variant of one avatar slot. */
export interface CustomAsset {
  id: string;
  name: string;
  svg: string;                 // full <svg>…</svg> source (sanitized)
  slot: SlotName;              // which avatar slot this asset extends
  recolor: RecolorRole | null; // legacy single tint — kept for back-compat
  /**
   * Per-original-color recolor map: normalized source fill (e.g. "#ffcc00") →
   * palette role. Colors absent from the map keep their original value.
   * Takes precedence over `recolor` when present.
   */
  recolorMap?: Record<string, RecolorRole>;
}

export interface SlotDef {
  name: string;
  parts: PartFn[];
}

export type PartFn = (p: Palette) => string; // returns SVG fragment (no outer <svg>)

export interface Recipe {
  seed: number;
  mode: Mode;
  harmony: Harmony;
  slots: { slot: string; variant: number; label: string }[];
}

export interface DesignResult {
  svg: string;
  palette: Palette;
  recipe: Recipe;
}
