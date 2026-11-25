import { Fragment } from 'react';

import { cn } from '@/shared/lib/cn';
import { Kbd } from '@/shared/ui/kbd';

/** Keyboard shortcut, e.g. `keys={['Ctrl', 'Shift', 'P']}` → Ctrl + Shift + P. */
export function KbdCombo({
  keys,
  separator = '+',
  className,
}: {
  keys: string[];
  separator?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
      {keys.map((key, i) => (
        <Fragment key={i}>
          {i > 0 && separator && <span aria-hidden>{separator}</span>}
          <Kbd>{key}</Kbd>
        </Fragment>
      ))}
    </span>
  );
}
