import { Check, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type TrackingStep = {
  id: string;
  label: ReactNode;
  icon?: LucideIcon;
  time?: ReactNode;
  location?: ReactNode;
};

/**
 * Order / shipment tracking: steps on a progress line filled up to the
 * current step. `current` is the index of the step in progress.
 */
export function TrackingStepper({
  steps,
  current,
  orientation = 'horizontal',
  className,
}: {
  steps: TrackingStep[];
  current: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  const progress =
    steps.length > 1 ? (Math.min(current, steps.length - 1) / (steps.length - 1)) * 100 : 0;

  const marker = (step: TrackingStep, i: number) => {
    const done = i < current;
    const active = i === current;
    const Icon = step.icon;
    return (
      <span
        className={cn(
          'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-card transition-colors',
          done && 'border-primary bg-primary text-primary-foreground',
          active &&
            'border-primary text-primary shadow-[0_0_0_5px_color-mix(in_srgb,var(--primary)_15%,transparent)]',
          !done && !active && 'text-muted-foreground',
        )}
      >
        {done ? <Check className="size-4" /> : Icon ? <Icon className="size-4" /> : i + 1}
      </span>
    );
  };

  if (orientation === 'vertical') {
    return (
      <ol className={cn('relative', className)}>
        {steps.map((step, i) => (
          <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-9 bottom-0 left-[1.125rem] w-0.5 -translate-x-1/2',
                  i < current ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            {marker(step, i)}
            <div className="pt-1.5">
              <p className={cn('text-sm font-medium', i > current && 'text-muted-foreground')}>
                {step.label}
              </p>
              {(step.time || step.location) && (
                <p className="text-xs text-muted-foreground">
                  {step.time}
                  {step.time && step.location && ' · '}
                  {step.location}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className={cn('relative overflow-x-auto', className)}>
      <ol
        className="relative grid min-w-[36rem]"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden
          className="absolute top-[1.0625rem] h-0.5 bg-border"
          style={{ left: `${50 / steps.length}%`, right: `${50 / steps.length}%` }}
        />
        <span
          aria-hidden
          className="absolute top-[1.0625rem] h-0.5 bg-primary transition-[width] duration-500"
          style={{ left: `${50 / steps.length}%`, width: `${progress * (1 - 1 / steps.length)}%` }}
        />
        {steps.map((step, i) => (
          <li key={step.id} className="flex flex-col items-center text-center">
            {marker(step, i)}
            <p className={cn('mt-2.5 text-sm font-medium', i > current && 'text-muted-foreground')}>
              {step.label}
            </p>
            {step.time && <p className="text-xs text-muted-foreground tabular-nums">{step.time}</p>}
            {step.location && <p className="text-xs text-muted-foreground">{step.location}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
