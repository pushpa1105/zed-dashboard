import { CalendarClock, MoreHorizontal, Plus, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { fileIconFor } from '@/shared/components/tree/file-icons';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';

export type NotificationItem = {
  id: string;
  actor: string;
  text: ReactNode;
  time: ReactNode;
  unread?: boolean;
  /** Optional inline actions (Accept / Decline…). */
  actions?: ReactNode;
};

/** Inbox-style notifications with unread markers and inline actions. */
export function NotificationList({ items }: { items: NotificationItem[] }) {
  return (
    <ul className="-mx-2 divide-y">
      {items.map((n) => (
        <li
          key={n.id}
          className={cn('flex gap-3 rounded-lg px-2 py-3', n.unread && 'bg-primary/[0.04]')}
        >
          <InitialsAvatar name={n.actor} size="sm" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm leading-snug">
              <span className="font-medium">{n.actor}</span>{' '}
              <span className="text-muted-foreground">{n.text}</span>
            </p>
            <p className="text-xs text-muted-foreground">{n.time}</p>
            {n.actions && <div className="flex gap-2 pt-1">{n.actions}</div>}
          </div>
          {n.unread && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          )}
        </li>
      ))}
    </ul>
  );
}

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  due?: string;
  priority?: 'high' | 'medium' | 'low';
};

const PRIORITY = { high: 'bg-destructive', medium: 'bg-warning', low: 'bg-muted-foreground/40' };

/** Working todo list: check off, add with Enter, remaining count. */
export function TodoList({
  initial,
  placeholder = 'Add a task and press Enter',
  remainingLabel = 'remaining',
}: {
  initial: Todo[];
  placeholder?: string;
  remainingLabel?: string;
}) {
  const [todos, setTodos] = useState(initial);
  const [draft, setDraft] = useState('');
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setTodos([{ id: crypto.randomUUID(), text: draft.trim(), done: false }, ...todos]);
          setDraft('');
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        <Button type="submit" size="icon" variant="outline" aria-label="Add task">
          <Plus />
        </Button>
      </form>
      <ul className="space-y-1">
        {todos.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50"
          >
            <Checkbox
              checked={t.done}
              onCheckedChange={(v) =>
                setTodos(todos.map((x) => (x.id === t.id ? { ...x, done: v === true } : x)))
              }
              aria-label={t.text}
            />
            {t.priority && <span className={cn('size-1.5 rounded-full', PRIORITY[t.priority])} />}
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm',
                t.done && 'text-muted-foreground line-through',
              )}
            >
              {t.text}
            </span>
            {t.due && <span className="text-xs text-muted-foreground">{t.due}</span>}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {remaining} {remainingLabel}
      </p>
    </div>
  );
}

/** Recently touched files with type icon, owner and size. */
export function RecentFiles({
  files,
}: {
  files: Array<{ id: string; name: string; owner: string; size: string; edited: ReactNode }>;
}) {
  return (
    <ul className="space-y-1">
      {files.map((f) => {
        const { icon: Icon, color } = fileIconFor(f.name);
        return (
          <li key={f.id} className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-muted/50">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{f.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {f.owner} · {f.edited}
              </p>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{f.size}</span>
            <Button variant="ghost" size="icon-sm" aria-label={`More for ${f.name}`}>
              <MoreHorizontal />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

/** Grid of shortcut tiles. */
export function QuickActions({
  actions,
  columns = 3,
}: {
  actions: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    color?: string;
    onClick?: () => void;
  }>;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        'grid gap-2',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
      )}
    >
      {actions.map((a) => {
        const color = a.color ?? 'var(--primary)';
        return (
          <button
            key={a.id}
            type="button"
            onClick={a.onClick}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card px-2 py-4 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span
              className="flex size-10 items-center justify-center rounded-lg"
              style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
            >
              <a.icon className="size-[1.15rem]" />
            </span>
            <span className="text-center leading-tight">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Upcoming bills / payouts with due dates and amounts. */
export function UpcomingPayments({
  payments,
  totalLabel = 'Due in the next 30 days',
}: {
  payments: Array<{ id: string; payee: string; due: string; amount: string; daysLeft: number }>;
  totalLabel?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{totalLabel}</p>
      <ul className="divide-y">
        {payments.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <CalendarClock className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.payee}</p>
              <p
                className={cn(
                  'text-xs',
                  p.daysLeft <= 3 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {p.due}
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums">{p.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
