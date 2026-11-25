import { CircleAlert, RotateCw } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { StatusBadge } from '@/shared/components/display/status-badge';
import type { Tone } from '@/shared/components/display/tone';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { daysFromToday, relativeDays, shortDate } from '../lib/format';
import { STAGE_COLOR, type DealStage } from '../model/crm';
import type { Quote, QuoteStatus } from '../model/quotes';

/** Inline error for a failed widget; the rest of the page keeps working. */
export function WidgetError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  const { t } = useTranslation('crm');
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center',
        className,
      )}
    >
      <CircleAlert className="size-5 text-destructive" />
      <p className="text-sm text-muted-foreground">{t('error.title')}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw /> {t('error.retry')}
      </Button>
    </div>
  );
}

/** Stage name with its colour dot (colour is never the only signal). */
export function StageBadge({ stage, className }: { stage: DealStage; className?: string }) {
  const { t } = useTranslation('crm');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
      {t(`stages.${stage}`)}
    </span>
  );
}

/** Tinted square with initials, standing in for a company logo. */
export function CompanyMark({ name, className }: { name: string; className?: string }) {
  const hue = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 360;
  const letters = name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
        className,
      )}
      style={{
        background: `color-mix(in srgb, hsl(${hue} 65% 50%) 14%, var(--card))`,
        color: `color-mix(in srgb, hsl(${hue} 65% 40%) 85%, var(--foreground))`,
      }}
      aria-hidden
    >
      {letters}
    </span>
  );
}

const QUOTE_TONE: Record<QuoteStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  declined: 'danger',
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const { t } = useTranslation('crm');
  return (
    <StatusBadge status={status} tone={QUOTE_TONE[status]} label={t(`quotes.status.${status}`)} />
  );
}

/** Expiry date, flagged when an open quote lapses within a week or already has. */
export function QuoteExpiry({ quote }: { quote: Quote }) {
  const { t, i18n } = useTranslation('crm');
  const days = daysFromToday(quote.validUntil);
  const open = quote.status === 'draft' || quote.status === 'sent';
  return (
    <span className="block leading-tight">
      <span className="block tabular-nums">{shortDate(quote.validUntil)}</span>
      {open && days <= 7 && (
        <span className={cn('text-xs', days < 0 ? 'text-destructive' : 'text-warning')}>
          {days < 0 ? t('quotes.expired') : relativeDays(quote.validUntil, i18n.language)}
        </span>
      )}
    </span>
  );
}

type FilterChip<T extends string> = { value: T; label: string; count: number };

/** Single-choice filter chips with counts; scrolls sideways on narrow screens. */
export function FilterChips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: FilterChip<T>[];
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 scrollbar-none flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            value === option.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          {option.label}
          <span className="text-xs tabular-nums opacity-80">{option.count}</span>
        </button>
      ))}
    </div>
  );
}
