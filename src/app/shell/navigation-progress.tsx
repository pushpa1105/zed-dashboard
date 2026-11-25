import { useNavigation } from '@/core/router/router';
import { cn } from '@/shared/lib/cn';

/** Thin bar at the top while a page's code is on its way. */
export function NavigationProgress() {
  const loading = useNavigation().state !== 'idle';
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-primary',
        loading
          ? 'animate-nav-progress'
          : 'scale-x-100 opacity-0 transition-[transform,opacity] duration-300',
      )}
    />
  );
}
