import { useRef, useMemo, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  composeFromIndices,
  composeSingleSlot,
  getSlotIndices,
  getSlotConfig,
} from "../../../lib/composer";
import { sanitizeSvg, listFillColors } from "../../../lib/customParts";
import { useAppDispatch } from "../../../stores/hooks";
import { addAsset, removeAsset, updateAsset } from "../../../stores/slices/customSlice";
import ImportSvgDialog from "./ImportSvgDialog";
import type {
  Mode,
  Harmony,
  Palette,
  CustomAsset,
  SlotName,
  RecolorRole,
} from "../../../types/studio";

const THUMB_SM = 56,
  GAP_SM = 7;
const THUMB_LG = 96,
  GAP_LG = 10;
const LABEL_H = 30;
const GROUP_MARGIN = 20;

function allCombinations(lengths: number[]): number[][] {
  return lengths.reduce<number[][]>(
    (acc, len) =>
      acc.flatMap((combo) =>
        Array.from({ length: Math.max(1, len) }, (_, i) => [...combo, i]),
      ),
    [[]],
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type VRow =
  | { kind: "label"; text: string; isFirst: boolean }
  | { kind: "items"; combos: number[][]; baseIdx: number }
  | { kind: "slot"; start: number; count: number };

interface VariationsProps {
  seed: number;
  mode: Mode;
  harmony: Harmony;
  palette: Palette;
  currentIndices: number[];
  customAssets: CustomAsset[];
  onSelect: (seed: number) => void;
}

export default function Variations({
  seed,
  mode,
  palette,
  currentIndices,
  customAssets,
  onSelect,
}: VariationsProps) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("all");
  const config = useMemo(() => getSlotConfig(mode, customAssets), [mode, customAssets]);
  const allCombos = useMemo(() => allCombinations(config.lengths), [config]);

  // SVG import — a "+" tile per slot opens a file picker, then a preview dialog.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotRef = useRef<SlotName | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    slot: SlotName;
    svg: string;
    name: string;
  } | null>(null);
  const [editingAsset, setEditingAsset] = useState<CustomAsset | null>(null);

  function openImport(slot: SlotName) {
    pendingSlotRef.current = slot;
    fileInputRef.current?.click();
  }

  async function onFileChosen(files: FileList | null) {
    const slot = pendingSlotRef.current;
    const file = files?.[0];
    if (slot && file && (/svg/i.test(file.type) || /\.svg$/i.test(file.name))) {
      const text = await file.text();
      setPendingImport({
        slot,
        svg: sanitizeSvg(text),
        name: file.name.replace(/\.svg$/i, ""),
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function commitImport(name: string, recolorMap: Record<string, RecolorRole>) {
    if (!pendingImport) return;
    dispatch(addAsset(name, pendingImport.svg, pendingImport.slot, recolorMap));
    setPendingImport(null);
  }

  // Migrate a legacy single-tint asset into a per-color map for the editor.
  function initialMapFor(asset: CustomAsset): Record<string, RecolorRole> {
    if (asset.recolorMap) return asset.recolorMap;
    if (asset.recolor) {
      return Object.fromEntries(
        listFillColors(asset.svg).map((c) => [c, asset.recolor!]),
      );
    }
    return {};
  }

  const seedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let s = 0; s < 30000 && map.size < allCombos.length; s++) {
      const key = getSlotIndices(s, mode, customAssets).join(",");
      if (!map.has(key)) map.set(key, s);
    }
    return map;
  }, [mode, customAssets, allCombos]);

  const activeKey = currentIndices.join(",");
  const activeSlot =
    activeTab === "all" ? null : config.names.indexOf(activeTab);
  const activeSlotName =
    activeSlot === null ? null : (config.names[activeSlot] as SlotName);

  // Imported variants of the active slot sit after the built-in ones; used for delete.
  const slotAssets = useMemo(
    () =>
      activeSlotName
        ? customAssets.filter((a) => a.slot === activeSlotName)
        : [],
    [activeSlotName, customAssets],
  );
  const baseLen =
    activeSlot === null ? 0 : config.lengths[activeSlot] - slotAssets.length;

  const singleSlotItems = useMemo(() => {
    if (activeSlot === null) return null;
    return Array.from({ length: config.lengths[activeSlot] }, (_, i) => {
      const combo = [...currentIndices];
      combo[activeSlot] = i;
      return combo;
    });
  }, [activeTab, mode, currentIndices]);

  const groups = useMemo(() => {
    if (activeSlot !== null || config.lengths.length <= 1) return null;
    return Array.from({ length: Math.max(1, config.lengths[0]) }, (_, i) => ({
      label: config.labels[0]?.[i] || 'None',
      combos: allCombos.filter((c) => c[0] === i),
    }));
  }, [activeTab, allCombos, mode, config]);

  const totalCount =
    activeSlot === null ? allCombos.length : config.lengths[activeSlot];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) =>
      setContainerWidth(e.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isSlotView = activeSlot !== null || !groups;
  const thumbSize = isSlotView ? THUMB_LG : THUMB_SM;
  const gap = isSlotView ? GAP_LG : GAP_SM;
  const cols = Math.max(
    1,
    Math.floor((containerWidth + gap) / (thumbSize + gap)),
  );

  const vrows = useMemo((): VRow[] => {
    if (activeSlot !== null) {
      // one cell per variant, plus a trailing "+" import tile
      const cellCount = singleSlotItems!.length + 1;
      const rows: VRow[] = [];
      for (let start = 0; start < cellCount; start += cols) {
        rows.push({
          kind: "slot",
          start,
          count: Math.min(cols, cellCount - start),
        });
      }
      return rows;
    } else if (groups) {
      const rows: VRow[] = [];
      let base = 0;
      groups.forEach((group, gi) => {
        rows.push({ kind: "label", text: group.label, isFirst: gi === 0 });
        chunk(group.combos, cols).forEach((combos, ri) => {
          rows.push({ kind: "items", combos, baseIdx: base + ri * cols });
        });
        base += group.combos.length;
      });
      return rows;
    } else {
      return chunk(allCombos, cols).map((combos, i) => ({
        kind: "items",
        combos,
        baseIdx: i * cols,
      }));
    }
  }, [activeSlot, groups, allCombos, singleSlotItems, cols]);

  const rowVirtualizer = useVirtualizer({
    count: vrows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      const row = vrows[i];
      if (row.kind === "label")
        return row.isFirst ? LABEL_H : LABEL_H + GROUP_MARGIN;
      return thumbSize + gap;
    },
    overscan: 3,
  });

  function renderThumb(combo: number[], onDelete?: () => void, onEdit?: () => void) {
    const key = combo.join(",");
    const svg =
      activeSlot !== null
        ? composeSingleSlot(activeSlot, combo[activeSlot], palette, mode, customAssets)
        : composeFromIndices(combo, palette, mode, customAssets);
    const isActive = key === activeKey;
    const targetSeed = seedMap.get(key) ?? seed;
    const thumb = (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            data-active={isActive || undefined}
            onClick={() => onSelect(targetSeed)}
            style={{
              width: thumbSize,
              height: thumbSize,
              borderRadius: isSlotView ? 14 : 10,
            }}
            className="border-2 border-white/60 dark:border-white/10 overflow-hidden cursor-pointer p-0 bg-white/50 dark:bg-white/4 backdrop-blur-sm transition-all hover:border-[#aa3bff]/60 dark:hover:border-[#c084fc]/50 hover:scale-110 hover:relative hover:z-10 hover:shadow-[0_6px_18px_-4px_rgba(0,0,0,0.3)] data-active:border-[#aa3bff] dark:data-active:border-[#c084fc] data-active:scale-110 data-active:relative data-active:z-10 data-active:shadow-[0_0_0_3px_rgba(170,59,255,0.25),0_6px_18px_-4px_rgba(170,59,255,0.55)] [&>svg]:block [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-[10px] px-2 py-1 bg-popover border-border text-accent-foreground"
        >
          seed {targetSeed}
        </TooltipContent>
      </Tooltip>
    );
    if (!onDelete && !onEdit) return <div key={key}>{thumb}</div>;
    return (
      <div key={key} className="relative group/thumb">
        {thumb}
        {onEdit && (
          <button
            onClick={onEdit}
            title="Edit imported SVG"
            className="absolute -top-1.5 -left-1.5 z-20 grid place-items-center w-5 h-5 rounded-full bg-primary text-primary-foreground shadow opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:scale-110"
          >
            <Pencil size={11} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            title="Delete imported SVG"
            className="absolute -top-1.5 -right-1.5 z-20 grid place-items-center w-5 h-5 rounded-full bg-destructive text-white shadow opacity-0 group-hover/thumb:opacity-100 transition-opacity hover:scale-110"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    );
  }

  function renderAddTile(slot: SlotName) {
    return (
      <Tooltip key="__add">
        <TooltipTrigger asChild>
          <button
            onClick={() => openImport(slot)}
            style={{ width: thumbSize, height: thumbSize, borderRadius: 14 }}
            className="border-2 border-dashed border-white/60 dark:border-white/12 flex items-center justify-center text-muted-foreground cursor-pointer bg-white/30 dark:bg-white/3 backdrop-blur-sm transition-all hover:border-[#aa3bff]/60 dark:hover:border-[#c084fc]/50 hover:text-[#aa3bff] dark:hover:text-[#c084fc] hover:scale-110"
          >
            <Plus size={thumbSize > 70 ? 24 : 16} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-[10px] px-2 py-1 bg-popover border-border text-accent-foreground"
        >
          Import SVG
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col gap-4 pb-5 sticky top-0 bg-background/70 backdrop-blur-xl z-10 shrink-0 border-b border-white/40 dark:border-white/6">
        <div className="flex items-center gap-2.5">
          <span className="relative w-2 h-2 shrink-0">
            <span className="absolute inset-0 rounded-full bg-[#aa3bff] dark:bg-[#c084fc]" />
            <span className="absolute inset-0 rounded-full bg-[#aa3bff] dark:bg-[#c084fc] blur-[3px] opacity-70" />
          </span>
          <span className="text-[13px] tracking-wide uppercase font-bold text-foreground">
            Variants
          </span>
          <Badge className="text-[10px] px-2 py-0 h-5 bg-[#aa3bff]/12 dark:bg-[#c084fc]/15 text-[#aa3bff] dark:text-[#c084fc] border border-[#aa3bff]/25 dark:border-[#c084fc]/25 font-semibold rounded-full">
            {totalCount}
          </Badge>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="self-start"
        >
          <TabsList className="inline-flex w-auto items-center bg-white/40 dark:bg-white/3 backdrop-blur-md border border-white/50 dark:border-white/8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] p-1 gap-1 rounded-xl h-auto!">
            <TabsTrigger
              value="all"
              className="flex-none h-7 px-3.5 text-[11px] font-medium rounded-lg border-0 cursor-pointer data-[state=active]:bg-[#aa3bff] dark:data-[state=active]:bg-[#c084fc] data-[state=active]:text-white dark:data-[state=active]:text-black data-[state=active]:shadow-[0_2px_8px_-2px_rgba(170,59,255,0.5)] text-muted-foreground hover:text-foreground transition-all"
            >
              All
            </TabsTrigger>
            {config.names.map((name) => (
              <TabsTrigger
                key={name}
                value={name}
                className="flex-none h-7 px-3.5 text-[11px] font-medium rounded-lg border-0 cursor-pointer data-[state=active]:bg-[#aa3bff] dark:data-[state=active]:bg-[#c084fc] data-[state=active]:text-white dark:data-[state=active]:text-black data-[state=active]:shadow-[0_2px_8px_-2px_rgba(170,59,255,0.5)] text-muted-foreground hover:text-foreground transition-all"
              >
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-5">
        <div
          style={{ height: rowVirtualizer.getTotalSize() }}
          className="relative"
        >
          {rowVirtualizer.getVirtualItems().map((vitem) => {
            const row = vrows[vitem.index];
            return (
              <div
                key={vitem.key}
                data-index={vitem.index}
                style={{
                  height: `${vitem.size}px`,
                  transform: `translateY(${vitem.start}px)`,
                }}
                className="absolute top-0 left-0 w-full"
              >
                {row.kind === "label" ? (
                  <div
                    style={{
                      paddingTop: row.isFirst ? 4 : GROUP_MARGIN + 4,
                      paddingBottom: 10,
                    }}
                    className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-linear-to-r after:from-border after:to-transparent"
                  >
                    <span className="h-2.5 w-0.5 rounded-full bg-linear-to-b from-[#aa3bff] to-[#aa3bff]/10 dark:from-[#c084fc] dark:to-[#c084fc]/10" />
                    {row.text}
                  </div>
                ) : row.kind === "items" ? (
                  <div
                    style={{ gap, paddingBottom: gap }}
                    className="flex justify-start"
                  >
                    {row.combos.map((combo) => renderThumb(combo))}
                  </div>
                ) : (
                  <div
                    style={{ gap, paddingBottom: gap }}
                    className="flex justify-start"
                  >
                    {Array.from({ length: row.count }, (_, j) => {
                      const variant = row.start + j;
                      if (variant === singleSlotItems!.length)
                        return renderAddTile(activeSlotName!);
                      const asset =
                        variant >= baseLen ? slotAssets[variant - baseLen] : null;
                      return renderThumb(
                        singleSlotItems![variant],
                        asset
                          ? () => dispatch(removeAsset(asset.id))
                          : undefined,
                        asset ? () => setEditingAsset(asset) : undefined,
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="hidden"
        onChange={(e) => onFileChosen(e.target.files)}
      />

      {pendingImport && (
        <ImportSvgDialog
          slot={pendingImport.slot}
          svg={pendingImport.svg}
          defaultName={pendingImport.name}
          palette={palette}
          onAdd={commitImport}
          onClose={() => setPendingImport(null)}
        />
      )}

      {editingAsset && (
        <ImportSvgDialog
          mode="edit"
          slot={editingAsset.slot}
          svg={editingAsset.svg}
          defaultName={editingAsset.name}
          initialMap={initialMapFor(editingAsset)}
          palette={palette}
          onAdd={(name, recolorMap) => {
            dispatch(updateAsset({ id: editingAsset.id, name, recolorMap }));
            setEditingAsset(null);
          }}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </div>
  );
}
