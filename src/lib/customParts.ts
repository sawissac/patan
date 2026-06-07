import type { CustomAsset, PartFn, Palette, RecolorRole } from '../types/studio';

const PAD = 16; // inset inside the 200×200 canvas
const BOX = 200 - PAD * 2;

/** Normalize a fill string into a stable map key (case-insensitive, no spaces). */
const normColor = (c: string) => c.trim().toLowerCase();

/**
 * Strip executable / event-handler content from imported SVG markup.
 * These files are user-supplied and later injected via dangerouslySetInnerHTML,
 * so remove <script>, event handlers, and javascript: URLs defensively.
 */
export function sanitizeSvg(raw: string): string {
  if (typeof DOMParser === 'undefined') return raw; // SSR / non-browser fallback
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return raw;

  svg.querySelectorAll('script, foreignObject').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase().replace(/\s/g, '');
      if (name.startsWith('on') || val.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return svg.outerHTML;
}

function viewBoxOf(el: SVGSVGElement): string {
  const vb = el.getAttribute('viewBox');
  if (vb) return vb;
  const w = parseFloat(el.getAttribute('width') ?? '') || 200;
  const h = parseFloat(el.getAttribute('height') ?? '') || 200;
  return `0 0 ${w} ${h}`;
}

/** Tint every visible fill to `color` so the asset adopts a studio palette role. */
function recolorFills(el: Element, color: string): void {
  el.querySelectorAll('*').forEach((node) => {
    const fill = node.getAttribute('fill');
    if (fill && fill.toLowerCase() !== 'none') node.setAttribute('fill', color);
  });
}

// Paint properties we treat as recolorable "components".
const PAINT_PROPS = ['fill', 'stroke'] as const;

// Values that aren't a concrete color we can map by value.
function isSolidColor(v: string): boolean {
  const c = normColor(v);
  return (
    c !== '' &&
    c !== 'none' &&
    c !== 'transparent' &&
    c !== 'inherit' &&
    c !== 'currentcolor' &&
    !c.startsWith('url(')
  );
}

type ClassRules = Record<string, Partial<Record<string, string>>>;

/** Parse simple `.class { fill: …; stroke: … }` rules from <style> blocks. */
function parseStyleRules(el: Element): ClassRules {
  const rules: ClassRules = {};
  el.querySelectorAll('style').forEach((s) => {
    const css = s.textContent ?? '';
    const blockRe = /([^{}]+)\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(css))) {
      const decl: Partial<Record<string, string>> = {};
      m[2].split(';').forEach((d) => {
        const i = d.indexOf(':');
        if (i < 0) return;
        const key = d.slice(0, i).trim().toLowerCase();
        if (key === 'fill' || key === 'stroke') decl[key] = d.slice(i + 1).trim();
      });
      if (Object.keys(decl).length === 0) continue;
      m[1].split(',').forEach((sel) => {
        const cls = sel.trim().match(/^\.([\w-]+)$/);
        if (cls) rules[cls[1]] = { ...rules[cls[1]], ...decl };
      });
    }
  });
  return rules;
}

/**
 * Resolve a paint value in CSS precedence order: inline style > stylesheet
 * class rule > presentation attribute.
 */
function readPaint(node: Element, prop: string, rules: ClassRules): string | null {
  const style = node.getAttribute('style');
  if (style) {
    const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i'));
    if (m) return m[1].trim();
  }
  const cls = node.getAttribute('class');
  if (cls) {
    for (const c of cls.split(/\s+/)) {
      const v = rules[c]?.[prop];
      if (v) return v;
    }
  }
  return node.getAttribute(prop);
}

/** Walk every paintable color (fill + stroke from attribute, inline style, or class rule). */
function forEachPaint(
  el: Element,
  fn: (color: string, node: Element, prop: string) => void,
): void {
  const rules = parseStyleRules(el);
  el.querySelectorAll('*').forEach((node) => {
    for (const prop of PAINT_PROPS) {
      const v = readPaint(node, prop, rules);
      if (v && isSolidColor(v)) fn(v, node, prop);
    }
  });
}

/**
 * Distinct fill/stroke colors of an SVG, in first-seen order. Each is a
 * "component" the user can independently assign a palette role to.
 */
export function listFillColors(svg: string): string[] {
  if (typeof DOMParser === 'undefined') return [];
  const el = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('svg');
  if (!el) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  forEachPaint(el, (color) => {
    const key = normColor(color);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(key);
  });
  return out;
}

/** Recolor each fill/stroke whose original color maps to a palette role. */
function applyRecolorMap(el: Element, map: Record<string, RecolorRole>, palette: Palette): void {
  forEachPaint(el, (color, node, prop) => {
    const role = map[normColor(color)];
    // Override via inline style so it beats both the attribute and any stylesheet.
    if (role) (node as SVGElement).style.setProperty(prop, palette[role]);
  });
}

/** Build the 200×200-fitted fragment, recoloring source fills per the role map. */
export function fragmentRecolored(
  svg: string,
  map: Record<string, RecolorRole>,
  palette: Palette,
): string {
  if (typeof DOMParser === 'undefined') return '';
  const el = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('svg');
  if (!el) return '';
  const viewBox = viewBoxOf(el);
  applyRecolorMap(el, map, palette);
  return (
    `<svg x="${PAD}" y="${PAD}" width="${BOX}" height="${BOX}" ` +
    `viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${el.innerHTML}</svg>`
  );
}

/** Standalone 200×200 preview with a per-color recolor map applied. */
export function assetPreviewSvgMapped(
  svg: string,
  map: Record<string, RecolorRole>,
  palette: Palette,
): string {
  const fragment = fragmentRecolored(svg, map, palette);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${fragment}</svg>`;
}

/**
 * Produce an SVG fragment that scales the imported asset into the studio's
 * 200×200 canvas via a nested <svg> — preserves aspect ratio.
 * When `color` is given, the asset's fills are tinted to it; otherwise it keeps its own colors.
 */
export function assetToFragment(asset: CustomAsset, color?: string): string {
  if (typeof DOMParser === 'undefined') return ''; // SSR / non-browser fallback
  const el = new DOMParser().parseFromString(asset.svg, 'image/svg+xml').querySelector('svg');
  if (!el) return '';
  const viewBox = viewBoxOf(el);
  if (color) recolorFills(el, color);
  const fill = color ? ` fill="${color}"` : ''; // wrapper fill covers elements with no explicit fill
  return (
    `<svg x="${PAD}" y="${PAD}" width="${BOX}" height="${BOX}" ` +
    `viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet"${fill}>${el.innerHTML}</svg>`
  );
}

/** Standalone 200×200 SVG of an asset for preview thumbnails (optionally recolored). */
export function assetPreviewSvg(svg: string, color?: string): string {
  const fragment = assetToFragment({ id: '', name: '', svg, slot: 'Background', recolor: null }, color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">${fragment}</svg>`;
}

/** Wrap a custom asset as a generator PartFn — recolors to its chosen palette role(s) when set. */
export function customPartFn(asset: CustomAsset): PartFn {
  if (asset.recolorMap && Object.keys(asset.recolorMap).length > 0) {
    const map = asset.recolorMap;
    return (p) => fragmentRecolored(asset.svg, map, p);
  }
  if (asset.recolor) {
    const role = asset.recolor;
    return (p) => assetToFragment(asset, p[role]);
  }
  const fragment = assetToFragment(asset);
  return () => fragment;
}
