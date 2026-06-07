import { Lock, Unlock, Dices, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Harmony } from '../../../types/studio';

const HARMONIES: { id: Harmony; label: string }[] = [
  { id: 'analogous', label: 'Analogous' },
  { id: 'complementary', label: 'Complementary' },
  { id: 'split-complementary', label: 'Split-Comp' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'tetradic', label: 'Tetradic' },
  { id: 'square', label: 'Square' },
  { id: 'monochrome', label: 'Monochrome' },
];

const SUB_LABEL = 'text-[9px] font-bold tracking-[0.14em] uppercase text-muted-foreground/80';
const STEPPER =
  'flex items-center justify-center w-8 shrink-0 rounded-lg cursor-pointer border border-white/50 dark:border-white/8 bg-white/40 dark:bg-white/3 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-white/6 active:scale-95 transition-all';

interface ControlsProps {
  seed: number;
  harmony: Harmony;
  locked: boolean;
  onSeedChange: (seed: number) => void;
  onHarmonyChange: (h: Harmony) => void;
  onLockToggle: () => void;
  onRandomize: () => void;
}

export default function Controls({
  seed,
  harmony,
  locked,
  onSeedChange,
  onHarmonyChange,
  onLockToggle,
  onRandomize,
}: ControlsProps) {
  const step = (delta: number) => onSeedChange(Math.max(0, seed + delta));

  return (
    <div className="flex flex-col gap-3.5">
      {/* Seed */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className={SUB_LABEL}>Seed</span>
          <button
            onClick={onLockToggle}
            title={locked ? 'Unlock seed' : 'Lock seed'}
            className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
              locked ? 'text-[#aa3bff] dark:text-[#c084fc]' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {locked ? <Lock size={11} /> : <Unlock size={11} />}
            {locked ? 'Locked' : 'Unlocked'}
          </button>
        </div>
        <div className="flex items-stretch gap-1.5 h-9">
          <button onClick={() => step(-1)} title="Decrease seed" className={STEPPER}>
            <Minus size={13} />
          </button>
          <Input
            type="number"
            value={seed}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onSeedChange(Math.abs(v));
            }}
            className="flex-1 h-full rounded-lg border border-white/50 dark:border-white/6 bg-white/40 dark:bg-white/3 backdrop-blur-sm text-[12px] font-medium text-accent-foreground text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] focus-visible:ring-0 focus-visible:border-[#aa3bff]/60 dark:focus-visible:border-[#c084fc]/50 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none px-2 transition-colors"
          />
          <button onClick={() => step(1)} title="Increase seed" className={STEPPER}>
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Harmony */}
      <div className="flex flex-col gap-1.5">
        <span className={SUB_LABEL}>Harmony</span>
        <ToggleGroup
          type="single"
          value={harmony}
          onValueChange={(v) => { if (v) onHarmonyChange(v as Harmony); }}
          className="grid grid-cols-2 gap-1.5 w-full"
        >
          {HARMONIES.map((h) => (
            <ToggleGroupItem
              key={h.id}
              value={h.id}
              className="h-7 px-2 text-[10.5px] font-medium rounded-lg cursor-pointer border border-white/50 dark:border-white/8 bg-white/30 dark:bg-white/3 backdrop-blur-sm text-muted-foreground data-on:bg-[#aa3bff] dark:data-on:bg-[#c084fc] data-on:border-transparent data-on:text-white dark:data-on:text-black data-on:shadow-[0_2px_8px_-2px_rgba(170,59,255,0.5)] hover:text-foreground transition-all"
            >
              {h.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Primary action */}
      <button
        onClick={onRandomize}
        disabled={locked}
        title={locked ? 'Unlock seed to randomize' : 'Randomize seed'}
        className="group relative w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide cursor-pointer overflow-hidden bg-linear-to-b from-[#b14dff] to-[#9b2bff] dark:from-[#c79bff] dark:to-[#a855f7] text-white shadow-[0_4px_14px_-4px_rgba(170,59,255,0.6),inset_0_1px_0_0_rgba(255,255,255,0.4)] hover:shadow-[0_6px_20px_-4px_rgba(170,59,255,0.75)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/60 to-transparent" />
        <Dices size={14} className="transition-transform duration-300 group-hover:rotate-12 group-active:rotate-90" />
        Randomize
      </button>
    </div>
  );
}
