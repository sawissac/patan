import { createPRNG, pick } from './prng';
import { generatePalette } from './palette';
import { customPartFn } from './customParts';
import type { Mode, Harmony, DesignResult, SlotDef, Palette, CustomAsset } from '../types/studio';

import { avatarBackgrounds, avatarBackgroundLabels } from '../features/Studio/parts/avatar/background';
import { avatarFaces, avatarFaceLabels } from '../features/Studio/parts/avatar/face';
import { avatarEyes, avatarEyeLabels } from '../features/Studio/parts/avatar/eyes';
import { avatarMouths, avatarMouthLabels } from '../features/Studio/parts/avatar/mouth';
import { avatarAccessories, avatarAccessoryLabels } from '../features/Studio/parts/avatar/accessory';

const BASE_AVATAR_SLOTS: SlotDef[] = [
  { name: 'Background', parts: avatarBackgrounds },
  { name: 'Face', parts: avatarFaces },
  { name: 'Eyes', parts: avatarEyes },
  { name: 'Mouth', parts: avatarMouths },
  { name: 'Accessory', parts: avatarAccessories },
];

const BASE_AVATAR_LABELS = [
  avatarBackgroundLabels,
  avatarFaceLabels,
  avatarEyeLabels,
  avatarMouthLabels,
  avatarAccessoryLabels,
];

/** Imported SVGs are appended as extra variants of the slot they were imported into. */
function avatarSlots(customAssets: CustomAsset[]): SlotDef[] {
  return BASE_AVATAR_SLOTS.map((slot) => {
    const extras = customAssets.filter((a) => a.slot === slot.name).map(customPartFn);
    return extras.length ? { ...slot, parts: [...slot.parts, ...extras] } : slot;
  });
}
function avatarLabels(customAssets: CustomAsset[]): string[][] {
  return BASE_AVATAR_LABELS.map((labels, i) => {
    const extras = customAssets.filter((a) => a.slot === BASE_AVATAR_SLOTS[i].name).map((a) => a.name);
    return extras.length ? [...labels, ...extras] : labels;
  });
}

function slotsFor(_mode: Mode, customAssets: CustomAsset[]): SlotDef[] {
  return avatarSlots(customAssets);
}

function labelsFor(_mode: Mode, customAssets: CustomAsset[]): string[][] {
  return avatarLabels(customAssets);
}

export function getSlotConfig(
  mode: Mode,
  customAssets: CustomAsset[] = [],
): { names: string[]; labels: string[][]; lengths: number[] } {
  const slots = slotsFor(mode, customAssets);
  return {
    names: slots.map((s) => s.name),
    labels: labelsFor(mode, customAssets),
    lengths: slots.map((s) => s.parts.length),
  };
}

/** Lightweight slot-index extraction — skips SVG generation for perf */
export function getSlotIndices(seed: number, mode: Mode, customAssets: CustomAsset[] = []): number[] {
  const rng = createPRNG(seed);
  return slotsFor(mode, customAssets).map((slot) => {
    if (slot.parts.length === 0) return 0;
    return pick(rng, slot.parts.length);
  });
}

export function composeFromIndices(
  indices: number[],
  palette: Palette,
  mode: Mode,
  customAssets: CustomAsset[] = [],
): string {
  let svgBody = '';
  slotsFor(mode, customAssets).forEach((slot, i) => {
    if (slot.parts.length > 0 && indices[i] !== undefined) {
      const partFn = slot.parts[indices[i]];
      if (partFn) {
        svgBody += partFn(palette);
      }
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${svgBody}</svg>`;
}

export function composeSingleSlot(
  slotIdx: number,
  partIdx: number,
  palette: Palette,
  mode: Mode,
  customAssets: CustomAsset[] = [],
): string {
  const slots = slotsFor(mode, customAssets);
  const partFn = slots[slotIdx]?.parts[partIdx];
  const body = partFn ? partFn(palette) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${body}</svg>`;
}

export function compose(
  seed: number,
  mode: Mode,
  harmony: Harmony,
  paletteSeed: number,
  customAssets: CustomAsset[] = [],
): DesignResult {
  // palette + parts use independent seeds — picking a part won't recolor
  const palette = generatePalette(createPRNG(paletteSeed), harmony);
  const rng = createPRNG(seed);

  let svgBody = '';
  const slotReadout: DesignResult['recipe']['slots'] = [];
  const labels = labelsFor(mode, customAssets);

  slotsFor(mode, customAssets).forEach((slot, i) => {
    if (slot.parts.length === 0) {
      slotReadout.push({ slot: slot.name, variant: 0, label: 'None' });
      return;
    }
    const idx = pick(rng, slot.parts.length);
    svgBody += slot.parts[idx](palette);
    slotReadout.push({ slot: slot.name, variant: idx, label: labels[i][idx] });
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${svgBody}</svg>`;

  return {
    svg,
    palette,
    recipe: { seed, mode, harmony, slots: slotReadout },
  };
}
