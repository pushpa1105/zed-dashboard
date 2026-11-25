import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type StepItem = { key: string; title: ReactNode; description?: ReactNode };

export type StepperProps = {
  steps: StepItem[];
  /** Index of the current step. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  /** Lets users jump back to completed steps. */
  onStepClick?: (index: number) => void;
  className?: string;
};

/** Progress header for multi-step flows: completed, current and upcoming steps. */
export function Stepper({
  steps,
  current,
  orientation = 'horizontal',
  onStepClick,
  className,
}: StepperProps) {
  const vertical = orientation === 'vertical';

  return (
    <ol className={cn('flex', vertical ? 'flex-col gap-0' : 'w-full items-start gap-2', className)}>
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
        const clickable = !!onStepClick && index < current;
        return (
          <li
            key={step.key}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn('flex', vertical ? 'gap-3' : 'flex-1 flex-col gap-2')}
          >
            <div className={cn('flex items-center', vertical ? 'flex-col' : 'gap-2')}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(index)}
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default',
                  state === 'done' && 'border-primary bg-primary text-primary-foreground',
                  state === 'current' && 'border-primary text-primary ring-4 ring-primary/15',
                  state === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {state === 'done' ? <Check className="size-3.5" /> : index + 1}
              </button>
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'rounded-full',
                    vertical ? 'my-1 min-h-6 w-px flex-1' : 'h-px flex-1',
                    index < current ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
            <div className={cn('min-w-0', vertical ? 'pb-6' : 'pr-2')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  state === 'upcoming' && 'text-muted-foreground',
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
