import { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { compose } from '../../lib/composer';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { setSeed, setHarmony, setLocked, shufflePalette, shuffle } from '../../stores/slices/studioSlice';

import Controls from './components/Controls';
import PaletteSwatch from './components/PaletteSwatch';
import RecipePanel from './components/Recipe';
import Variations from './components/Variations';
import ExportButton from './components/ExportButton';
import ThemeToggle from './components/ThemeToggle';

const SIDEBAR = {
  hidden: { x: -16, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.22, ease: [0.25, 0, 0, 1] } },
};

const STAGGER = {
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

const ITEM = {
  hidden: { y: 6, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.2, ease: [0.25, 0, 0, 1] } },
};

// Frosted sub-panel — translucent fill, hairline top sheen, soft inset highlight.
const GLASS_CARD =
  'rounded-2xl border border-white/50 dark:border-white/6 bg-white/45 dark:bg-white/2.5 backdrop-blur-md p-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]';

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-0.5 rounded-full bg-linear-to-b from-foreground/50 to-foreground/5" />
        <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
          {children}
        </span>
      </div>
      {action}
    </div>
  );
}

export default function Studio() {
  const dispatch = useAppDispatch();
  const { seed, paletteSeed, mode, harmony, locked } = useAppSelector((s) => s.studio);
  const customAssets = useAppSelector((s) => s.custom.assets);
  const result = useMemo(
    () => compose(seed, mode, harmony, paletteSeed, customAssets),
    [seed, mode, harmony, paletteSeed, customAssets]
  );

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const onResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onResizeMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setSidebarWidth(Math.min(500, Math.max(200, e.clientX - 16)));
  }, []);

  const onResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  return (
    <div
      data-resizing={isResizing || undefined}
      className="flex flex-1 h-0 overflow-hidden bg-muted/30 dark:bg-background/50 text-foreground font-sans data-resizing:cursor-col-resize data-resizing:select-none max-[680px]:flex-col relative"
    >
      <div className="py-4 pl-4 h-full shrink-0 flex max-[680px]:p-0 max-[680px]:w-full max-[680px]:h-auto relative z-10">
        <motion.aside
          style={{ width: sidebarWidth }}
          variants={SIDEBAR}
          initial="hidden"
          animate="visible"
          className="relative flex flex-col overflow-hidden h-full rounded-[28px] border border-white/40 dark:border-white/10 bg-linear-to-b from-white/65 to-white/40 dark:from-white/7 dark:to-white/1.5 backdrop-blur-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] max-[680px]:rounded-none max-[680px]:border-x-0 max-[680px]:border-t-0 max-[680px]:border-b max-[680px]:w-full! max-[680px]:min-w-0 max-[680px]:max-w-none"
        >
          {/* glass depth: top sheen + soft brand glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/80 dark:via-white/30 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-16 w-56 h-56 rounded-full bg-[#aa3bff]/10 dark:bg-[#c084fc]/10 blur-3xl"
          />

          <motion.div
            variants={ITEM}
            className="relative px-5 pt-5 pb-4 shrink-0 flex items-center justify-between gap-2 border-b border-white/30 dark:border-white/6"
          >
            <div className="flex items-center gap-2 text-[13px] font-bold tracking-[-0.2px] text-foreground">
              <span className="relative w-2 h-2 shrink-0">
                <span className="absolute inset-0 rounded-full bg-[#aa3bff] dark:bg-[#c084fc]" />
                <span className="absolute inset-0 rounded-full bg-[#aa3bff] dark:bg-[#c084fc] blur-[3px] opacity-70" />
              </span>
              Patan Studio
            </div>
            <ThemeToggle />
          </motion.div>

          <motion.div
            variants={STAGGER}
            initial="hidden"
            animate="visible"
            className="relative flex-1 overflow-y-auto flex flex-col gap-3 px-4 py-4 scrollbar-thin [&::-webkit-scrollbar]:w-0.75 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-sm"
          >
            <motion.div variants={ITEM} className={`${GLASS_CARD} flex flex-col gap-3`}>
              <SectionLabel>Generate</SectionLabel>
              <Controls
                seed={seed}
                harmony={harmony}
                locked={locked}
                onSeedChange={(s) => dispatch(setSeed(s))}
                onHarmonyChange={(h) => dispatch(setHarmony(h))}
                onLockToggle={() => dispatch(setLocked(!locked))}
                onRandomize={() => dispatch(shuffle())}
              />
            </motion.div>

            <motion.div variants={ITEM} className={`${GLASS_CARD} flex flex-col gap-3`}>
              <SectionLabel
                action={
                  <button
                    onClick={() => dispatch(shufflePalette())}
                    title="New palette"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer [&:hover_svg]:rotate-180 [&_svg]:transition-transform [&_svg]:duration-300"
                  >
                    <RefreshCw size={12} />
                  </button>
                }
              >
                Palette
              </SectionLabel>
              <PaletteSwatch palette={result.palette} />
            </motion.div>

            <motion.div variants={ITEM} className={`${GLASS_CARD} flex flex-col gap-3`}>
              <SectionLabel>Recipe</SectionLabel>
              <RecipePanel recipe={result.recipe} />
            </motion.div>
          </motion.div>

          <motion.div
            variants={ITEM}
            className="relative px-4 py-4 shrink-0 border-t border-white/30 dark:border-white/6"
          >
            <ExportButton svg={result.svg} seed={seed} />
          </motion.div>

          <div
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            className="group absolute top-0 right-0 w-1.25 h-full cursor-col-resize z-10 flex items-center justify-center max-[680px]:hidden"
          >
            <span
              data-resizing={isResizing || undefined}
              className="w-px h-12 bg-transparent rounded-sm transition-all duration-200 group-hover:bg-primary/50 group-hover:h-16 group-hover:w-[3px] data-resizing:bg-primary data-resizing:h-16 data-resizing:w-[3px]"
            />
          </div>
        </motion.aside>
      </div>

      <main className="flex-1 flex flex-col items-stretch overflow-hidden py-10 px-12 min-w-0 max-[680px]:p-5">
        <Variations
          seed={seed}
          mode={mode}
          harmony={harmony}
          palette={result.palette}
          currentIndices={result.recipe.slots.map((s) => s.variant)}
          customAssets={customAssets}
          onSelect={(s) => dispatch(setSeed(s))}
        />
      </main>
    </div>
  );
}
