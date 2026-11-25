import { ArrowDownLeft, ArrowUpRight, Megaphone, Nfc, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

/** Credit-card style balance with card number tail and in/out summary. */
export function BalanceCard({
  balance,
  holder,
  last4,
  expiry,
  income,
  spending,
  labels = { balance: 'Total balance', income: 'Income', spending: 'Spending' },
  className,
}: {
  balance: string;
  holder: string;
  last4: string;
  expiry: string;
  income: string;
  spending: string;
  labels?: { balance: string; income: string; spending: string };
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative aspect-[1.6/1] overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-lg shadow-primary/20 [background:linear-gradient(135deg,var(--primary),color-mix(in_srgb,var(--primary)_55%,var(--chart-4)))]">
        <span
          aria-hidden
          className="absolute -top-16 -right-10 size-48 rounded-full bg-primary-foreground/10"
        />
        <span
          aria-hidden
          className="absolute -bottom-20 -left-8 size-48 rounded-full bg-primary-foreground/5"
        />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-primary-foreground/70">{labels.balance}</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{balance}</p>
            </div>
            <Nfc className="size-6 text-primary-foreground/80" />
          </div>
          <p className="font-mono text-sm tracking-[0.2em] whitespace-nowrap text-primary-foreground/90">
            •••• •••• •••• {last4}
          </p>
          <div className="flex items-end justify-between text-xs">
            <span className="font-medium tracking-wide uppercase">{holder}</span>
            <span className="tabular-nums">{expiry}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: labels.income,
            value: income,
            icon: ArrowDownLeft,
            tone: 'text-success bg-success/10',
          },
          {
            label: labels.spending,
            value: spending,
            icon: ArrowUpRight,
            tone: 'text-destructive bg-destructive/10',
          },
        ].map((x) => (
          <div key={x.label} className="flex min-w-0 items-center gap-2.5 rounded-xl border p-3">
            <span className={cn('flex size-8 items-center justify-center rounded-lg', x.tone)}>
              <x.icon className="size-4" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{x.label}</p>
              <p className="text-sm font-semibold whitespace-nowrap tabular-nums">{x.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dismissible announcement with a primary action. */
export function AnnouncementCard({
  eyebrow,
  title,
  body,
  action,
  dismissLabel = 'Dismiss',
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
  dismissLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      className={cn('relative overflow-hidden rounded-xl border bg-card p-6 shadow-xs', className)}
    >
      <span aria-hidden className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/10" />
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3"
        aria-label={dismissLabel}
        onClick={() => setOpen(false)}
      >
        <X />
      </Button>
      <div className="relative space-y-3 pr-6">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Megaphone className="size-5" />
        </span>
        {eyebrow && (
          <p className="text-xs font-medium tracking-wide text-primary uppercase">{eyebrow}</p>
        )}
        <p className="text-base font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  );
}
