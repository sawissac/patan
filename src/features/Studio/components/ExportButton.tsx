import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  svg: string;
  seed: number;
}

export default function ExportButton({ svg, seed }: ExportButtonProps) {
  const handleExport = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-${seed}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      className="group relative w-full h-9 text-[11px] font-semibold tracking-wide cursor-pointer overflow-hidden rounded-xl border border-white/50 dark:border-white/8 bg-white/40 dark:bg-white/3 backdrop-blur-md text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] hover:border-[#aa3bff]/50 dark:hover:border-[#c084fc]/40 hover:bg-white/60 dark:hover:bg-white/6 gap-1.5 transition-colors"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/70 dark:via-white/30 to-transparent" />
      <Download size={13} className="text-[#aa3bff] dark:text-[#c084fc] transition-transform group-hover:-translate-y-px" />
      Export SVG
    </Button>
  );
}
