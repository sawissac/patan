import type { Recipe } from '../../../types/studio';

interface RecipeProps {
  recipe: Recipe;
}

export default function RecipePanel({ recipe }: RecipeProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg bg-white/40 dark:bg-white/3 border border-white/40 dark:border-white/5 px-2.5 py-1.5 text-[10px] font-mono">
        <span className="text-muted-foreground">Seed</span>
        <strong className="text-[#aa3bff] dark:text-[#c084fc]">{recipe.seed}</strong>
      </div>
      <div className="flex flex-col">
        {recipe.slots.map((s, i) => (
          <div
            key={s.slot}
            className={`flex justify-between items-center text-[10.5px] py-1.5 transition-colors hover:bg-white/40 dark:hover:bg-white/3 rounded-md px-2 -mx-2 ${i > 0 ? 'border-t border-white/30 dark:border-white/4' : ''}`}
          >
            <span className="text-muted-foreground">{s.slot}</span>
            <span className="text-accent-foreground font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
