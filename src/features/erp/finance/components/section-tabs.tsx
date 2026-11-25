import { useTranslation } from '@/core/i18n/use-translation';
import { cn } from '@/shared/lib/cn';

import { FINANCE_SECTIONS, type FinanceSection } from '../model/overview';

import { GLASS } from './glass';

/** Pill tab bar that scopes every widget on the page to a workspace section. */
export function SectionTabs({
  value,
  onChange,
}: {
  value: FinanceSection;
  onChange: (section: FinanceSection) => void;
}) {
  const { t } = useTranslation('erp', { keyPrefix: 'finance' });

  return (
    <div
      role="tablist"
      aria-label={t('sections.label')}
      className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1', GLASS)}
    >
      {FINANCE_SECTIONS.map((section) => {
        const active = section === value;
        return (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(section)}
            className={cn(
              'h-8 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
              active && 'bg-card text-foreground shadow-sm ring-1 ring-border/70',
            )}
          >
            {t(`sections.${section}`)}
          </button>
        );
      })}
    </div>
  );
}
