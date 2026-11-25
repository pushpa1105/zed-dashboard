import { Check, Eye, EyeOff, X } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

import { cn } from '@/shared/lib/cn';
import { Input } from '@/shared/ui/input';

export type PasswordRule = { key: string; label: string; test: (value: string) => boolean };

/** A sensible default policy. Pass `rules` to replace it. */
const DEFAULT_RULES: PasswordRule[] = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  {
    key: 'case',
    label: 'Upper and lower case letters',
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { key: 'number', label: 'A number', test: (v) => /\d/.test(v) },
  { key: 'symbol', label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const LEVELS = [
  { label: 'Too weak', color: 'bg-destructive' },
  { label: 'Weak', color: 'bg-destructive' },
  { label: 'Fair', color: 'bg-warning' },
  { label: 'Good', color: 'bg-chart-4' },
  { label: 'Strong', color: 'bg-success' },
];

export type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'> & {
  /** Show the strength bar and rules checklist. */
  showStrength?: boolean;
  rules?: PasswordRule[];
  showLabel?: string;
  hideLabel?: string;
};

/** Password field with reveal toggle and an optional strength meter + rule checklist. */
export function PasswordInput({
  showStrength,
  rules = DEFAULT_RULES,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  className,
  value,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const text = typeof value === 'string' ? value : '';
  const passed = rules.filter((r) => r.test(text)).length;
  const score = text ? Math.round((passed / rules.length) * (LEVELS.length - 1)) : 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          value={value}
          type={visible ? 'text' : 'password'}
          className={cn('pr-9', className)}
        />
        <button
          type="button"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showStrength && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    text && score >= i ? LEVELS[score]!.color : 'bg-muted',
                  )}
                />
              ))}
            </div>
            <span className="w-14 text-right text-xs text-muted-foreground">
              {text ? LEVELS[score]!.label : ''}
            </span>
          </div>
          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {rules.map((rule) => {
              const ok = rule.test(text);
              return (
                <li
                  key={rule.key}
                  className={cn(
                    'flex items-center gap-1.5',
                    ok ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {ok ? <Check className="size-3.5 text-success" /> : <X className="size-3.5" />}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
