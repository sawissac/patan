import StoreProvider from './providers/StoreProvider';
import Studio from './features/Studio/Studio';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function App() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TooltipProvider delayDuration={600}>
        <StoreProvider>
          <Studio />
        </StoreProvider>
      </TooltipProvider>
    </div>
  );
}
