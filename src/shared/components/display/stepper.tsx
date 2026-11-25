import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type Step = { key: string; title: ReactNode; description?: ReactNode };

export type StepperProps = {
  steps: Step[];
  /** Index of the current step; earlier steps render as complete. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  /** Makes steps clickable (e.g. jump back in a wizard). */
  onStepClick?: (index: number) => void;
  className?: string;
};

/** Progress through an ordered process: complete / current / upcoming steps. */
export function Stepper({
  steps,
  current,
  orientation = 'horizontal',
  onStepClick,
  className,
}: StepperProps) {
  const vertical = orientation === 'vertical';

  return (
    <ol
      className={cn(vertical ? 'space-y-0' : 'flex items-start gap-2', className)}
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const state = index < current ? 'complete' : index === current ? 'current' : 'upcoming';
        const last = index === steps.length - 1;
        const Marker = onStepClick ? 'button' : 'span';
        return (
          <li
            key={step.key}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn('relative', vertical ? 'flex gap-3 pb-6 last:pb-0' : 'flex-1')}
          >
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute',
                  vertical ? 'top-8 bottom-0 left-[13px] w-0.5' : 'top-[13px] right-1 left-9 h-0.5',
                  index < current ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <div className={cn('flex', vertical ? 'gap-3' : 'flex-col gap-2')}>
              <Marker
                type={onStepClick ? 'button' : undefined}
                onClick={onStepClick ? () => onStepClick(index) : undefined}
                className={cn(
                  'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-card',
                  state === 'complete' && 'bg-primary text-primary-foreground',
                  state === 'current' &&
                    'border-2 border-primary bg-card text-primary shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_15%,transparent)]',
                  state === 'upcoming' && 'border bg-card text-muted-foreground',
                )}
              >
                {state === 'complete' ? <Check className="size-3.5" /> : index + 1}
              </Marker>
              <div className={cn('min-w-0', !vertical && 'pr-2')}>
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
            </div>
          </li>
        );
      })}
    </ol>
  );
}
