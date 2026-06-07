import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assetPreviewSvgMapped, listFillColors } from '../../../lib/customParts';
import type { Palette, RecolorRole, SlotName } from '../../../types/studio';

const ROLES: { role: RecolorRole; label: string }[] = [
  { role: 'bg', label: 'BG' },
  { role: 'c1', label: 'C1' },
  { role: 'c2', label: 'C2' },
  { role: 'c3', label: 'C3' },
  { role: 'ink', label: 'Ink' },
];

interface ImportSvgDialogProps {
  slot: SlotName;
  svg: string;          // sanitized raw SVG source
  defaultName: string;
  palette: Palette;
  onAdd: (name: string, recolorMap: Record<string, RecolorRole>) => void;
  onClose: () => void;
  mode?: 'import' | 'edit';                  // edit reuses this dialog for existing assets
  initialMap?: Record<string, RecolorRole>;  // prefill per-color assignments
}

export default function ImportSvgDialog({
  slot,
  svg,
  defaultName,
  palette,
  onAdd,
  onClose,
  mode = 'import',
  initialMap,
}: ImportSvgDialogProps) {
  const [name, setName] = useState(defaultName);
  const [map, setMap] = useState<Record<string, RecolorRole>>(initialMap ?? {});
  const isEdit = mode === 'edit';

  // Each distinct source fill is a recolorable "component" of the asset.
  const colors = useMemo(() => listFillColors(svg), [svg]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const previewSvg = useMemo(
    () => assetPreviewSvgMapped(svg, map, palette),
    [svg, map, palette],
  );

  function setRole(color: string, role: RecolorRole | null) {
    setMap((prev) => {
      const next = { ...prev };
      if (role === null) delete next[color];
      else next[color] = role;
      return next;
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <span className="text-[13px] font-bold text-foreground">
            {isEdit ? 'Edit' : 'Import into'} <span className="text-primary">{slot}</span>
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div
            className="self-center w-36 h-36 rounded-xl border border-border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px] overflow-hidden [&>svg]:w-full [&>svg]:h-full"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-[12px] bg-muted border-border focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Components · assign palette colors
            </label>
            {colors.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-1">
                No recolorable fills — this asset keeps its original colors.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                {colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5"
                  >
                    <span
                      className="h-6 w-6 shrink-0 rounded-md border border-border bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:8px_8px]"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground w-16 shrink-0 truncate">
                      {color}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-end flex-1">
                      <button
                        onClick={() => setRole(color, null)}
                        data-active={map[color] === undefined || undefined}
                        title="Keep original"
                        className="h-6 px-2 rounded-md text-[10px] font-medium border-2 border-border bg-background text-muted-foreground transition-all data-active:border-primary data-active:text-foreground"
                      >
                        Keep
                      </button>
                      {ROLES.map(({ role, label }) => (
                        <button
                          key={role}
                          onClick={() => setRole(color, role)}
                          data-active={map[color] === role || undefined}
                          title={`Recolor to ${label}`}
                          className="h-6 w-6 rounded-md border-2 border-border transition-all hover:scale-110 data-active:border-primary data-active:scale-110"
                          style={{ background: palette[role] }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-border shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-8 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onAdd(name.trim() || defaultName, map)}
            className="h-8 text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isEdit ? 'Save' : `Add to ${slot}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
