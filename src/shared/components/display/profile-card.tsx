import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { InitialsAvatar } from './initials-avatar';

export type ProfileCardProps = {
  name: string;
  role?: ReactNode;
  /** Small stats under the header, e.g. [{label:'Projects', value: 12}]. */
  stats?: Array<{ label: ReactNode; value: ReactNode }>;
  /** Tags, contact rows, bio… */
  children?: ReactNode;
  actions?: ReactNode;
  status?: 'online' | 'away' | 'offline';
  className?: string;
};

/** Person summary: cover band, avatar, name/role, stats and actions. */
export function ProfileCard({
  name,
  role,
  stats,
  children,
  actions,
  status,
  className,
}: ProfileCardProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card shadow-xs', className)}>
      <div className="h-16 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary)_22%,var(--card)),color-mix(in_oklch,var(--chart-2)_16%,var(--card)))]" />
      <div className="-mt-8 space-y-4 px-5 pb-5">
        <div className="flex items-end justify-between gap-3">
          <span className="rounded-full ring-4 ring-card">
            <InitialsAvatar name={name} size="xl" status={status} />
          </span>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
        <div>
          <p className="text-base font-semibold">{name}</p>
          {role && <p className="text-sm text-muted-foreground">{role}</p>}
        </div>
        {stats && (
          <dl className="grid grid-cols-3 divide-x rounded-lg border text-center">
            {stats.map((s, i) => (
              <div key={i} className="py-2">
                <dd className="font-semibold tabular-nums">{s.value}</dd>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
        {children}
      </div>
    </div>
  );
}
