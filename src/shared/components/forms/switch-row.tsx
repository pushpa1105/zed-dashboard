import { useId, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Switch } from '@/shared/ui/switch';

export type SwitchRowProps = {
  label: ReactNode;
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  icon?: ReactNode;
  disabled?: boolean;
  /** Bordered card style instead of a plain row. */
  bordered?: boolean;
  className?: string;
};

/** A settings row: label and description on the left, switch on the right. */
export function SwitchRow({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  icon,
  disabled,
  bordered,
  className,
}: SwitchRowProps) {
  const id = useId();
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        bordered && 'rounded-xl border p-4',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )}
        <div className="space-y-0.5">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
