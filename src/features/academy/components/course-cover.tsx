import {
  ChartNoAxesCombined,
  Code2,
  Compass,
  Database,
  Palette,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/shared/lib/cn';

import type { Category } from '../model/academy';

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  data: Database,
  design: Palette,
  engineering: Code2,
  product: Compass,
  leadership: Users,
};

/**
 * Course artwork without images: a tinted tile in the course color with a
 * faint grid and the category icon. Looks intentional in both themes.
 */
export function CourseCover({
  color,
  category,
  className,
  size = 'md',
}: {
  color: string;
  category: Category;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const Icon = CATEGORY_ICON[category] ?? ChartNoAxesCombined;
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        background: `linear-gradient(140deg, color-mix(in srgb, ${color} 22%, var(--card)), color-mix(in srgb, ${color} 8%, var(--card)))`,
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(color-mix(in srgb, ${color} 25%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, ${color} 25%, transparent) 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
          maskImage: 'linear-gradient(135deg, black, transparent 75%)',
        }}
      />
      <span
        className={cn(
          'absolute flex items-center justify-center rounded-xl text-overlay-foreground shadow-sm',
          size === 'sm' && 'top-1/2 left-1/2 size-8 -translate-1/2 rounded-lg [&>svg]:size-4',
          size === 'md' && 'bottom-4 left-4 size-10 [&>svg]:size-5',
          size === 'lg' && 'bottom-6 left-6 size-14 [&>svg]:size-7',
        )}
        style={{ background: color }}
      >
        <Icon />
      </span>
    </div>
  );
}
