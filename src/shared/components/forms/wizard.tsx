import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';

import { Stepper, type StepItem } from './stepper';

export type WizardStep = StepItem & {
  content: ReactNode;
  /**
   * Runs before leaving the step forward. Return false to stay. With
   * react-hook-form: `validate: () => form.trigger(['name', 'email'])`.
   */
  validate?: () => boolean | Promise<boolean>;
};

export type WizardProps = {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  orientation?: 'horizontal' | 'vertical';
  labels?: {
    back?: string;
    next?: string;
    finish?: string;
    step?: (n: number, total: number) => string;
  };
  className?: string;
};

/**
 * Multi-step flow: stepper header, the current step's content, and a footer
 * with Back / Next / Finish. Each step can validate before advancing.
 */
export function Wizard({
  steps,
  onComplete,
  orientation = 'horizontal',
  labels = {},
  className,
}: WizardProps) {
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(false);
  const step = steps[current]!;
  const last = current === steps.length - 1;
  const {
    back = 'Back',
    next = 'Continue',
    finish = 'Finish',
    step: stepLabel = (n: number, total: number) => `Step ${n} of ${total}`,
  } = labels;

  const advance = async () => {
    setBusy(true);
    try {
      const ok = (await step.validate?.()) ?? true;
      if (!ok) return;
      if (last) await onComplete();
      else setCurrent((c) => c + 1);
    } finally {
      setBusy(false);
    }
  };

  const vertical = orientation === 'vertical';

  return (
    <div className={cn(vertical ? 'grid gap-8 md:grid-cols-[220px_1fr]' : 'space-y-6', className)}>
      <Stepper steps={steps} current={current} orientation={orientation} onStepClick={setCurrent} />
      <div className="flex min-w-0 flex-col gap-6">
        <div key={step.key} className="animate-in duration-200 fade-in-0 slide-in-from-right-2">
          {step.content}
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-xs text-muted-foreground">
            {stepLabel(current + 1, steps.length)}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={current === 0 || busy}
              onClick={() => setCurrent((c) => c - 1)}
            >
              {back}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void advance()}>
              {busy && <Spinner />}
              {last ? finish : next}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
