import { Mail, MapPin, MessageSquare, Quote } from 'lucide-react';
import type { ReactNode } from 'react';

import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { RatingStars } from '@/shared/components/display/rating-stars';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

/** Ranked people (sales reps, contributors) with value and relative bar. */
export function Leaderboard({
  rows,
  format = (n: number) => n.toLocaleString(),
}: {
  rows: Array<{ id: string; name: string; meta?: ReactNode; value: number }>;
  format?: (n: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3">
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
              i === 0 ? 'bg-warning/25 text-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {i + 1}
          </span>
          <InitialsAvatar name={r.name} size="sm" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{r.name}</span>
              <span className="text-sm font-semibold tabular-nums">{format(r.value)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Who's around right now, with presence and what they're doing. */
export function TeamOnline({
  members,
  onlineLabel = 'online',
}: {
  members: Array<{
    id: string;
    name: string;
    role: string;
    status: 'online' | 'away' | 'offline';
    activity?: ReactNode;
  }>;
  onlineLabel?: string;
}) {
  const online = members.filter((m) => m.status === 'online').length;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-success">{online}</span> {onlineLabel} · {members.length}
      </p>
      <ul className="space-y-3">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <InitialsAvatar name={m.name} status={m.status} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="truncate text-xs text-muted-foreground">{m.activity ?? m.role}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`Message ${m.name}`}>
              <MessageSquare />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Person = {
  name: string;
  title: string;
  location?: string;
  email?: string;
  stats?: Array<{ label: string; value: ReactNode }>;
};

/**
 * Person card in three shapes: `cover` (banner + centered), `horizontal`
 * (avatar left, details right) and `compact` (one row).
 */
export function UserProfileWidget({
  person,
  variant = 'cover',
  actions,
  className,
}: {
  person: Person;
  variant?: 'cover' | 'horizontal' | 'compact';
  actions?: ReactNode;
  className?: string;
}) {
  if (variant === 'compact') {
    return (
      <div
        className={cn('flex items-center gap-3 rounded-xl border bg-card p-4 shadow-xs', className)}
      >
        <InitialsAvatar name={person.name} size="md" status="online" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{person.name}</p>
          <p className="truncate text-xs text-muted-foreground">{person.title}</p>
        </div>
        {actions}
      </div>
    );
  }
  if (variant === 'horizontal') {
    return (
      <div className={cn('flex gap-4 rounded-xl border bg-card p-5 shadow-xs', className)}>
        <InitialsAvatar name={person.name} size="xl" shape="square" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-base font-semibold">{person.name}</p>
            <p className="text-sm text-muted-foreground">{person.title}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {person.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {person.location}
              </span>
            )}
            {person.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" /> {person.email}
              </span>
            )}
          </div>
          {actions && <div className="flex gap-2 pt-1">{actions}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card shadow-xs', className)}>
      <div className="h-20 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--primary)_35%,var(--card)),color-mix(in_srgb,var(--chart-5)_25%,var(--card)))]" />
      <div className="-mt-9 space-y-3 px-5 pb-5 text-center">
        <InitialsAvatar name={person.name} size="xl" className="rounded-full ring-4 ring-card" />
        <div>
          <p className="text-base font-semibold">{person.name}</p>
          <p className="text-sm text-muted-foreground">{person.title}</p>
        </div>
        {person.stats && (
          <dl className="grid grid-cols-3 divide-x rounded-lg border py-2">
            {person.stats.map((s) => (
              <div key={s.label}>
                <dd className="text-sm font-semibold tabular-nums">{s.value}</dd>
                <dt className="text-[0.6875rem] text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
        {actions && <div className="flex justify-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Customer quote with rating and attribution. */
export function TestimonialCard({
  quote,
  name,
  role,
  rating,
  className,
}: {
  quote: ReactNode;
  name: string;
  role: ReactNode;
  rating?: number;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        'flex h-full flex-col gap-4 rounded-xl border bg-card p-6 shadow-xs',
        className,
      )}
    >
      <Quote className="size-6 text-primary/40" aria-hidden />
      <blockquote className="flex-1 text-[0.9375rem] leading-relaxed">{quote}</blockquote>
      <figcaption className="flex items-center gap-3">
        <InitialsAvatar name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        {rating !== undefined && <RatingStars value={rating} />}
      </figcaption>
    </figure>
  );
}
