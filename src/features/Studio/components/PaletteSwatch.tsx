import type { Palette } from '../../../types/studio';

const ROLE_LABELS = ['BG', 'C1', 'C2', 'C3', 'INK'];

interface PaletteSwatchProps {
  palette: Palette;
}

export default function PaletteSwatch({ palette }: PaletteSwatchProps) {
  return (
    <div className="flex gap-1.5">
      {palette.swatches.map((color, i) => (
        <div key={i} className="flex-1 flex flex-col gap-1.5 group">
          <div
            style={{ background: color }}
            title={color}
            className="relative h-12 rounded-xl border border-white/60 dark:border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_1px_3px_rgba(0,0,0,0.12)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_6px_16px_-4px_rgba(0,0,0,0.3)] cursor-pointer overflow-hidden"
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/25 to-transparent" />
          </div>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[8px] font-bold tracking-wider text-muted-foreground uppercase">
              {ROLE_LABELS[i]}
            </span>
            <span className="text-[7px] font-mono text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
              {color.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
